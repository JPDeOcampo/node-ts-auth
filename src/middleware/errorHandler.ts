import type { Request, Response, NextFunction } from "express";
import { AppError } from "@/utils/errors/appError.js";

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  console.error("Global Error:", error);

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      field: error.field,
    });
  }

  if (error instanceof Error) {
    return res.status(500).json({
      message: error.message,
    });
  }

  return res.status(500).json({
    message: "Something went wrong",
  });
};
