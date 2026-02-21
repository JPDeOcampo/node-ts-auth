import type { Request, Response } from "express";
import * as passwordService from "@/services/auth/passwordService.js";

// --- User Update Password ---
export const updatePassword = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;
  await passwordService.updatePassword({ id, currentPassword, newPassword });
  return res.status(200).json({ message: "Password changed successfully" });
};

// --- Forgot Password ---
export const forgotPassword = async (req: Request, res: Response) => {
  await passwordService.forgotPassword(req.body);
  return res.status(200).json({
    message: "Reset code is sent to your email",
  });
};

// --- Verify Reset Password ---
export const verifyResetPWVerificationCode = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const resetToken = await passwordService.verifyResetPWVerificationCode(
    req.body,
  );

  // Send resetToken in HTTP-only cookie
  res.cookie("resetToken", resetToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 2 * 60 * 1000, // 2 minutes
    path: "/api/user/reset",
  });

  return res.status(200).json({
    message: "Verification code is valid",
  });
};

// --- Reset Password ---
export const resetPassword = async (req: Request, res: Response) => {
  const emailParam = req.query.email;
  const { newPassword } = req.body.newPassword;
  await passwordService.resetPassword({ emailParam, newPassword });
  return res.status(200).json({ message: "Password reset successfully" });
};
