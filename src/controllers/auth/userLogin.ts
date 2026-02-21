import type { Request, Response } from "express";
import User from "@/models/User.js";
import crypto from "crypto";
import { verifyPassword } from "@/utils/authUtils.js";
import { serialize } from "cookie";
import { generateAuthToken } from "@/utils/generateAuthToken.js";

export const userLogin = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const pepper = process.env.PEPPER;

    if (!pepper) {
      throw new Error("Server configuration error: Pepper is missing.");
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    const authError = () =>
      res.status(401).json({ message: "Invalid email or password" });

    if (!user) return authError();

    const isValid = await verifyPassword(req.body.password, user.password);
    if (!isValid) return authError();

    // Create Access Token (Short-lived)
    const accessToken = await generateAuthToken({
      id: user._id,
      expiresIn: "15m",
    });
    // Create Refresh Token (Long-lived)
    const refreshToken = await generateAuthToken({
      id: user._id,
      expiresIn: "7d",
    });

    // 4. Hash the Refresh Token for DB storage
    const hashedRefreshToken = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    // 5. Manage Session Bloat (Limit to 5 active sessions)
    // We also filter out expired tokens during this update
    const now = new Date();
    let activeSessions = user.refreshTokens.filter((t) => t.expiresAt > now);

    if (activeSessions.length >= 5) {
      activeSessions.shift(); // Remove the oldest session
    }

    activeSessions.push({
      token: hashedRefreshToken,
      createdAt: now,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    user.refreshTokens = activeSessions;
    await user.save();

    // Send Refresh Token in a Cookie
    res.setHeader(
      "Set-Cookie",
      serialize("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60,
        path: "/",
      }),
    );

    return res.status(200).json({
      accessToken,
      userId: user._id,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "An unexpected error occurred." });
  }
};
