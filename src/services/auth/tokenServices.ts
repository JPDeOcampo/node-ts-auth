import type { JwtPayload } from "jsonwebtoken";
import User from "@/models/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { generateAuthToken } from "@/utils/generateAuthToken.js";
import { AppError } from "@/utils/errors/appError.js";

export const refreshToken = async (token: string) => {
  if (!token) throw new AppError("No refresh token", 401);

  // Verify the JWT signature
  const decoded = jwt.verify(
    token,
    process.env.JWT_REFRESH_SECRET!,
  ) as JwtPayload;

  const hashedIncomingToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  // Find user and check if this specific hashed token exists
  const user = await User.findOne({
    _id: decoded.id,
    "refreshTokens.token": hashedIncomingToken,
  });

  if (!user) {
    // If the token is valid but not in the DB, it might be a reused token.
    throw new AppError("Invalid or expired session", 403);
  }

  // REFRESH TOKEN ROTATION
  // Delete the old used token and issue a brand new one
  user.refreshTokens = user.refreshTokens.filter(
    (t) => t.token !== hashedIncomingToken && t.expiresAt > new Date(),
  );

  const newAccessToken = await generateAuthToken({
    id: user._id,
    expiresIn: "15m",
  });
  const newRefreshToken = await generateAuthToken({
    id: user._id,
    expiresIn: "7d",
  });

  const newHashedToken = crypto
    .createHash("sha256")
    .update(newRefreshToken)
    .digest("hex");

  user.refreshTokens.push({
    token: newHashedToken,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  await user.save();
  return { newAccessToken, newRefreshToken };
};
