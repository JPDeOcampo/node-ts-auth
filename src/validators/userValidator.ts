import { z } from "zod";

export const registerSchema = z
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

export const emailSchema = z.object({
  email: z.email("Invalid email format").min(1, "Email is required"),
});

export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),

    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number")
      .regex(/[@$!%*?&]/, "Must contain at least one special character"),

    reEnterPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.reEnterPassword, {
    message: "Passwords do not match",
    path: ["reEnterPassword"],
  });
