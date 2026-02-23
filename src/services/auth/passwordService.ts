import { Types } from "mongoose";
import User from "@/models/User.js";
import { hashPassword, verifyPassword } from "@/utils/authUtils.js";
import { AppError } from "@/utils/errors/appError.js";
import type {
  UpdatePasswordDTO,
  VerifyResetPWVerificationCodeDTO,
  RefreshResetPasswordCodeDTO,
} from "@/@types/password.types.js";
import { sendResetPassword } from "@/utils/mailer/sendResetPassword.js";
import { generate6DigitCode } from "@/utils/globalUtils.js";
import bcrypt from "bcrypt";
import { generateSignToken } from "@/utils/generateSignToken.js";
import jwt from "jsonwebtoken";

// --- Update Password Logic ---
export const updatePassword = async (data: UpdatePasswordDTO) => {
  const { id, currentPassword, newPassword } = data;

  // Validate ObjectId first
  if (!Types.ObjectId.isValid(id as unknown as string)) {
    throw new AppError("Invalid user ID.", 400);
  }

  // Find user
  const user = await User.findById(id).select("+password");

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  // Verify current password
  const isMatch = await verifyPassword(currentPassword, user.password);
  if (!isMatch) {
    throw new AppError("Current password is incorrect.", 401);
  }

  // Prevent password reuse
  const isSamePassword = await verifyPassword(newPassword, user.password);

  if (isSamePassword) {
    throw new AppError("New password cannot be same as old password.", 400);
  }

  // Hash new password
  user.password = await hashPassword(newPassword);
  user.markModified("password");
  return await user.save();
};

// --- Forgot Password Logic ---
export const forgotPassword = async (email: string) => {
  const existingUser = await User.findOne({ email });

  // Check if the user exists and is not a social account
  if (!existingUser || existingUser.socialAccount) {
    return;
  }

  // Generate a 6 digit random code and set expiration time (2 minutes)
  const verificationCode = generate6DigitCode();
  const verificationCodeExpires = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

  // Save verification code and expiration to the user document
  existingUser.verificationCode = await bcrypt.hash(verificationCode, 10);
  existingUser.verificationCodeExpires = verificationCodeExpires;

  // Send the reset email
  const emailSent = await sendResetPassword({
    email,
    resetCode: verificationCode,
  });

  if (!emailSent) {
    throw new AppError("Failed to send reset email", 500);
  }

  return await existingUser.save();
};

// --- Verify Reset Password Verification Code Logic ---
export const verifyResetPWVerificationCode = async (
  data: VerifyResetPWVerificationCodeDTO,
) => {
  const { email, verificationCode } = data;

  if (!email || !verificationCode) {
    throw new AppError("Email and verification code are required", 400);
  }

  const user = await User.findOne({ email }).select(
    "+verificationCode +verificationCodeExpires",
  );

  if (!user || !user.verificationCode || !user.verificationCodeExpires) {
    throw new AppError("Invalid verification code", 400);
  }

  const now = new Date();
  const validCode = await bcrypt.compare(
    verificationCode,
    user.verificationCode,
  );

  // Check if code matches
  if (!validCode) {
    throw new AppError("Invalid verification code", 400);
  }

  // Check if code is expired
  if (user.verificationCodeExpires < now) {
    throw new AppError("Verification code has expired", 400);
  }

  // Generate short-lived reset token (2 minutes)
  const resetToken = await generateSignToken({
    id: user._id,
    purpose: "password-reset",
    expiresIn: "2m",
  });

  return resetToken;
};

// --- Reset Password Logic ---
export const resetPassword = async (data: any) => {
  if (typeof data.email !== "string") {
    throw new AppError("Invalid email parameter", 400);
  }

  const email = data.email.toLowerCase();

  const newPassword = data.newPassword;

  // Find the user by email
  const user = await User.findOne({ email });

  if (
    !user ||
    !user.verificationCode ||
    !user.verificationCodeExpires ||
    user.verificationCodeExpires < new Date()
  ) {
    throw new AppError("Invalid verification code", 400);
  }

  // Update user password and clear verification code
  user.password = await hashPassword(newPassword);
  user.markModified("password");
  user.set("verificationCode", undefined);
  user.set("verificationCodeExpires", undefined);

  return await user.save();
};

// --- Refresh Reset Password Logic ---
export const refreshResetPassword = async (refreshToken: string) => {
  if (!refreshToken) {
    throw new AppError("Reset token is missing or expired", 400);
  }

  let payload: RefreshResetPasswordCodeDTO;

  try {
    payload = jwt.verify(
      refreshToken,
      process.env.JWT_ACCESS_SECRET!,
    ) as RefreshResetPasswordCodeDTO;

    if (payload.purpose !== "password-reset") {
      throw new AppError("Invalid reset token", 400);
    }
  } catch (error) {
    throw new AppError("Reset token is invalid or expired", 400);
  }

  return payload;
};

// --- Resend Reset Verification Code Logic ---
export const resendResetVerificationCode = async (id: string | undefined | string[]) => {
  const existingUser = await User.findById(id);

  if (!existingUser) {
    throw new AppError("User not found", 404);
  }

  // Generate a 6 random code and set expiration time (2 minutes) for reset token
  const resetVerificationCode = generate6DigitCode();
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
    throw new AppError("Failed to send reset email", 500);
  }
};
