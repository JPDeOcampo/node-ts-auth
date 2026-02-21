import type { Request, Response } from "express";
import type { JwtPayload } from "jsonwebtoken";
import User from "@/models/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { serialize } from "cookie";
import { generateAuthToken } from "@/utils/generateAuthToken.js";

export const refreshToken = async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken;

  if (!token) return res.status(401).json({ message: "No refresh token" });

  try {
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
      return res.status(403).json({ message: "Invalid or expired session" });
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

    res.setHeader(
      "Set-Cookie",
      serialize("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60,
        path: "/",
      }),
    );

    return res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error("Refresh token error:", error);
    // If JWT is expired or malformed, return 403
    return res
      .status(403)
      .json({ message: "Session expired. Please login again." });
  }
};
