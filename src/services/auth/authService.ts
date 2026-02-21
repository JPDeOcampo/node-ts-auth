import User from "@/models/User.js";
import { hashPassword, verifyPassword } from "@/utils/authUtils.js";
import { generateAuthToken } from "@/utils/generateAuthToken.js";
import { AppError } from "@/utils/errors/appError.js";
import type { RegisterUserDTO, LoginUserDTO } from "@/@types/auth.types.js";
import crypto from "crypto";

// --- Registration Logic ---
export const registerUser = async (userData: RegisterUserDTO) => {
  const { firstName, lastName, email, password } = userData;

  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await User.findOne({ email: normalizedEmail }).lean();

  if (existingUser) {
    throw new AppError("The email is already registered.", 400, "email");
  }

  const hashedPassword = await hashPassword(password);

  const newUser = new User({
    firstName,
    lastName,
    email: normalizedEmail,
    password: hashedPassword,
  });

  return newUser.save();
};

// --- Login Logic ---
export const loginUser = async (credentials: LoginUserDTO) => {
  const { email, password } = credentials;
  const pepper = process.env.PEPPER;

  if (!pepper) {
    throw new AppError("Server configuration error: Pepper is missing.");
  }

  // Find User
  const user = await User.findOne({ email: email.toLowerCase() });

  const authError = new AppError("Invalid email or password.", 401);
  if (!user) {
    throw authError;
  }

  // Verify Password
  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    throw authError;
  }

  // Generate Tokens
  const accessToken = await generateAuthToken({
    id: user._id,
    expiresIn: "15m",
  });
  const refreshToken = await generateAuthToken({
    id: user._id,
    expiresIn: "7d",
  });

  // Hash Refresh Token for DB storage
  const hashedRefreshToken = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  // Manage Sessions
  const now = new Date();
  let activeSessions = user.refreshTokens.filter((t) => t.expiresAt > now);

  if (activeSessions.length >= 5) {
    activeSessions.shift();
  }

  activeSessions.push({
    token: hashedRefreshToken,
    createdAt: now,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  user.refreshTokens = activeSessions;
  await user.save();

  return { user, accessToken, refreshToken };
};
