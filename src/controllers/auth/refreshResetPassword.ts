import type { Request, Response } from "express";
import jwt from "jsonwebtoken";

interface ResetTokenPayload {
  id: string;
  purpose: "password-reset";
  iat?: number;
  exp?: number;
}

export const refreshResetPassword = async (req: Request, res: Response) => {
  try {
    const resetToken = req.cookies.resetToken;

    if (!resetToken) {
      return res.status(400).json({ message: "Reset token is missing or expired" });
    }

    let payload: ResetTokenPayload;

    try {
      payload = jwt.verify(resetToken, process.env.JWT_ACCESS_SECRET!) as ResetTokenPayload;

      if (payload.purpose !== "password-reset") {
        return res.status(400).json({ message: "Invalid reset token" });
      }
    } catch {
      return res.status(400).json({ message: "Reset token is invalid or expired" });
    }

    return res.status(200).json({
      message: "Reset token is valid",
    });
  } catch (error) {
    console.error("Error verifying reset token:", error);
    return res.status(500).json({ message: error || "An unexpected error occurred." });
  }
};