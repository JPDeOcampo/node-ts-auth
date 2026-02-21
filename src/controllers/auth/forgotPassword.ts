import type { Request, Response } from "express";
import User from "@/models/User.js";
import { sendResetPassword } from "@/utils/mailer/sendResetPassword.js";
import { generate6DigitCode } from "@/utils/globalUtils.js";
import bcrypt from "bcrypt";

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Check if the user exists and is not a social account
    const existingUser = await User.findOne({ email });
    if (!existingUser || existingUser.socialAccount) {
      return res.status(404).json({
        message: "Email not found",
      });
    }

    // Generate a 5 digit random code and set expiration time (2 minutes)
    const verificationCode = generate6DigitCode();
    const verificationCodeExpires = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    // Save verification code and expiration to the user document
    existingUser.verificationCode = await bcrypt.hash(verificationCode, 10);
    existingUser.verificationCodeExpires = verificationCodeExpires;
    await existingUser.save();

    // Send the reset email
    const emailSent = await sendResetPassword({
      email,
      resetCode: verificationCode,
    });
    if (!emailSent) {
      return res.status(500).json({ message: "Failed to send reset email" });
    }

    return res.status(200).json({
      message: "Reset code is sent to your email",
    });
  } catch (error) {
    return res.status(500).json({
      message: error || "An unexpected error occurred.",
    });
  }
};
