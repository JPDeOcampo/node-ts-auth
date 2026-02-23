import User from "@/models/User.js";
import { AppError } from "@/utils/errors/appError.js";
import crypto from "crypto";

export const userSingleLogout = async (token: string) => {
  if (token) {
    // Hash the token to find the match in our DB
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // This ensures logging out on Web doesn't log you out on Mobile.
    return await User.updateOne(
      { "refreshTokens.token": hashedToken },
      { $pull: { refreshTokens: { token: hashedToken } } },
    );
  }
};

export const logoutAllDevices = async (userId: string | undefined) => {
  if (!userId) {
    throw new AppError("User not authenticated", 401);
  }

  return await User.findByIdAndUpdate(userId, {
    $set: { refreshTokens: [] },
  });
};
