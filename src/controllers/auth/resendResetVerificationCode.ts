import type { Request, Response } from "express";
import User from "@/models/User.js";
import { sendResetPassword } from "@/utils/mailer/sendResetPassword.js";
import { generate5DigitCode } from "@/utils/globalUtils.js";

export const resendResetVerificationCode = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;

    // Check if the user exists and is not a social account
    const existingUser = await User.findById(id);

    if (!existingUser) {
      return res.status(404).json({
        message: "Invalid user ID",
        invalidEmail: true,
      });
    }

    // Generate a 4-byte random hex reset token
    const resetVerificationCode = generate5DigitCode();
    const resetVerificationCodeExpires = new Date(Date.now() + 2 * 60 * 1000);

    // Save verification code and expiration to the user document
    existingUser.verificationCode = resetVerificationCode;
    existingUser.verificationCodeExpires = resetVerificationCodeExpires;
    await existingUser.save();

    // Send the reset email
    const emailSent = await sendResetPassword({
      email: existingUser.email,
      resetCode: resetVerificationCode,
    });

    if (!emailSent) {
      return res.status(500).json({ message: "Failed to send reset email" });
    }

    return res.status(200).json({ message: "Reset code is sent to your email" });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};
