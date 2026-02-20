import type { Request, Response } from "express";
import User from "@/models/User.js";
import { hashPassword } from "@/utils/authUtils.js";

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const emailParam = req.params.email;

    if (typeof emailParam !== "string") {
      return res.status(400).send("Invalid email parameter");
    }

    const email = emailParam.toLowerCase();

    const { newPassword } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });

    if (
      !user ||
      !user.verificationCode ||
      !user.verificationCodeExpires ||
      user.verificationCodeExpires < new Date()
    ) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    // Update user password and clear verification code
    user.password = await hashPassword(newPassword);
    user.markModified("password");
    user.set("verificationCode", undefined);
    user.set("verificationCodeExpires", undefined);
    await user.save();

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    return res
      .status(500)
      .json({ message: error || "An unexpected error occurred." });
  }
};
