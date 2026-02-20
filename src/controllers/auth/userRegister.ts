import type { Request, Response } from "express";
import User from "@/models/User.js";
import bcrypt from "bcrypt";
import { z } from "zod";

// Validation Schema
const RegisterSchema = z
  .object({
    firstName: z.string().min(2, "First name is too short"),
    lastName: z.string().min(2, "Last name is too short"),
    email: z.email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    reEnterPassword: z.string(),
  })
  .refine((data) => data.password === data.reEnterPassword, {
    message: "Passwords do not match",
    path: ["reEnterPassword"],
  });

export const userRegister = async (req: Request, res: Response) => {
  try {
    // Validate input
    const validation = RegisterSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: z.treeifyError(validation.error),
      });
    }

    const { firstName, lastName, email, password } = validation.data;

    // Normalize email (prevents "User@me.com" and "user@me.com" being two accounts)
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const existingUser = await User.findOne({ email: normalizedEmail }).lean();

    if (existingUser) {
      return res.status(400).json({
        message: "This email is already registered.",
        field: "email",
      });
    }

    // Hash Password
    const pepper = process.env.PEPPER;
    const saltRounds = 12;
    const passwordWithPepper = password + pepper;
    const hashedPassword = await bcrypt.hash(passwordWithPepper, saltRounds);

    // Save User
    const newUser = new User({
      firstName,
      lastName,
      email: normalizedEmail,
      password: hashedPassword,
    });

    await newUser.save();

    return res.status(201).json({
      message: "User registered successfully! You can now log in.",
    });
  } catch (error: any) {
    console.error("Registration Error:", error);
    return res.status(500).json({ message: "An unexpected error occurred." });
  }
};
