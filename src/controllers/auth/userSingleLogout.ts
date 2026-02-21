import type { Request, Response } from "express";
import User from "@/models/User.js";
import crypto from "crypto";
import { serialize } from "cookie";

export const userSingleLogout = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.refreshToken;

    if (token) {
      // Hash the token to find the match in our DB
      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      // This ensures logging out on Web doesn't log you out on Mobile.
      await User.updateOne(
        { "refreshTokens.token": hashedToken },
        { $pull: { refreshTokens: { token: hashedToken } } }
      );
    }

    // We set the maxAge to 0 and the date to the past to force deletion
    res.setHeader(
      "Set-Cookie",
      serialize("refreshToken", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        expires: new Date(0),
        path: "/",
      })
    );

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "An error occurred during logout." });
  }
};