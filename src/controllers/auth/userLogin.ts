import type { Request, Response } from "express";
import User from "@/models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const pepper = process.env.PEPPER;
    
    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    // Compare with Pepper
    const isValid = await bcrypt.compare(password + pepper, user.password);
    if (!isValid) return res.status(401).json({ message: "Invalid credentials" });

    // Create Access Token (Short-lived)
    const accessToken = jwt.sign(
      { id: user._id }, 
      process.env.JWT_ACCESS_SECRET!, 
      { expiresIn: "15m" }
    );

    // Create Refresh Token (Long-lived)
    const refreshToken = jwt.sign(
      { id: user._id }, 
      process.env.JWT_REFRESH_SECRET!, 
      { expiresIn: "7d" }
    );

    // Store Refresh Token in DB to allow remote logout
    user.refreshToken = refreshToken; 
    await user.save();

    // Send Refresh Token in a Cookie
    res.setHeader("Set-Cookie", serialize("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/api/user/refreshToken",
    }));

    return res.status(200).json({ accessToken, userId: user._id });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
