import type { Request, Response } from "express";
import User from "@/models/User.js";
import { serialize } from "cookie";

export const logoutAllDevices = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id; 

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    await User.findByIdAndUpdate(userId, {
      $set: { refreshTokens: [] }
    });

    res.setHeader("Set-Cookie", serialize("refreshToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: new Date(0),
      path: "/",
    }));

    return res.status(200).json({ message: "Logged out from all devices successfully" });
  } catch (error) {
    console.error("Global logout error:", error);
    return res.status(500).json({ message: "Global logout failed" });
  }
};