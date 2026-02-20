import type { Request, Response } from "express";
import type { JwtPayload } from "jsonwebtoken";
import User from "@/models/User.js";
import jwt from "jsonwebtoken";

export const refreshToken = async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken;

  if (!token) return res.status(401).json({ message: "No refresh token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as JwtPayload;
    
    // Find user and verify the token matches
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== token) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Issue new Access Token
    const newAccessToken = jwt.sign(
      { id: user._id }, 
      process.env.JWT_ACCESS_SECRET!, 
      { expiresIn: "15m" }
    );

    return res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error("Refresh token error:", error);
    return res.status(403).json({ message: "An unexpected error occurred." });
  }
};