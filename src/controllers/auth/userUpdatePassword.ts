import type { Request, Response } from "express";
import { Types } from "mongoose";
import Users from "@/models/User.js";
import { hashPassword, verifyPassword } from "@/utils/authUtils.js";

export const userUpdatePassword = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Validate ObjectId first
    if (!Types.ObjectId.isValid(id as unknown as string)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Find user
    const user = await Users.findById(id).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isMatch = await verifyPassword(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Prevent password reuse
    const isSamePassword = await verifyPassword(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        message: "New password cannot be same as old password",
      });
    }

    // Hash new password
    user.password = await hashPassword(newPassword);
    user.markModified('password');
    await user.save();

    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Password update error:", error);
    return res.status(500).json({ message: error || "An unexpected error occurred." });
  }
};
