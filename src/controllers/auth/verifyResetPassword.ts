import type { Request, Response } from "express";
import User from "@/models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { generateAuthToken } from "@/utils/generateAuthToken.js";

export const verifyResetPassword = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { email, verificationCode } = req.body;

    if (!email || !verificationCode) {
      return res
        .status(400)
        .json({ message: "Email and verification code are required" });
    }

    // Find the user by email
    const user = await User.findOne({ email }).select(
      "+verificationCode +verificationCodeExpires",
    );

    if (!user || !user.verificationCode || !user.verificationCodeExpires) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    const now = new Date();
    const validCode = await bcrypt.compare(
      verificationCode,
      user.verificationCode,
    );

    // Check if code matches
    if (!validCode) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    // Check if code is expired
    if (user.verificationCodeExpires < now) {
      return res.status(400).json({ message: "Verification code has expired" });
    }

    // Clear verification code fields
    user.set("verificationCode", undefined);
    user.set("verificationCodeExpires", undefined);
    await user.save();

    // Generate short-lived reset token (10 minutes)
    const resetToken = await generateAuthToken({
      id: user._id,
      purpose: "password-reset",
      expiresIn: "10m",
    });

  // Send resetToken in HTTP-only cookie
    res.cookie("resetToken", resetToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 10 * 60 * 1000, // 10 minutes
      path: "/api/user/reset",
    });

    return res.status(200).json({
      message: "Verification code is valid",
    });
  } catch (error) {
    console.error("Error verifying reset password code:", error);
    return res
      .status(500)
      .json({ message: error || "Internal Server Error" });
  }
};
