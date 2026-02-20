import type { Request, Response } from "express";
import { Types } from "mongoose";
import bcrypt from "bcrypt";
import Users from "@/models/User.js";
import { updatePasswordSchema } from "@/validators/userValidator.js";
import { z } from "zod";

interface Params {
  id: string;
}


export const updatePassword = async (
  req: Request<Params>,
  res: Response,
): Promise<Response> => {
  try {
    const { id } = req.params;

    // Validate ObjectId first
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Zod validation
    const parsed = updatePasswordSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: z.treeifyError(parsed.error),
      });
    }

    const { currentPassword, newPassword } = parsed.data;

    // Find user (ensure password is selectable in schema)
    const user = await Users.findById(id).select("+password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Current password is incorrect",
      });
    }

    // Prevent password reuse
    const isSamePassword = await bcrypt.compare(newPassword, user.password);

    if (isSamePassword) {
      return res.status(400).json({
        message: "New password cannot be same as old password",
      });
    }

    // Hash password
    const pepper = process.env.PEPPER;
    const saltRounds = 12;
    const passwordWithPepper = newPassword + pepper;
    const hashedPassword = await bcrypt.hash(passwordWithPepper, saltRounds);

    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Password update error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
