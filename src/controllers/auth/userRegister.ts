import type { Request, Response } from "express";
import User from "@/models/User.js";
import { hashPassword } from "@/utils/authUtils.js";

export const userRegister = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Normalize email (prevents "User@me.com" and "user@me.com" being two accounts)
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const existingUser = await User.findOne({ email: normalizedEmail }).lean();

    if (existingUser) {
      return res.status(400).json({
        message: "The email is already registered. Please log in or use a different email.",
        field: "email",
      });
    }

    // Save User
    const newUser = new User({
      firstName,
      lastName,
      email: normalizedEmail,
      password: await hashPassword(password),
    });

    await newUser.save();

    return res.status(201).json({
      message: "User registered successfully! You can now log in.",
    });
  } catch (error) {
    console.error("Registration Error:", error);
    return res.status(500).json({ message: "An unexpected error occurred." });
  }
};
