import bcrypt from "bcrypt";
import crypto from "crypto";

const pepper: string = process.env.PEPPER || "yourSecretPepper";
const saltRounds: number = 12;

const passwordWithPepper = (password: string): string => {
  return crypto.createHmac("sha256", pepper).update(password).digest("hex");
};
/**
 * Hash a password with pepper
 * @param password - Plain text password
 * @returns Hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(passwordWithPepper(password), saltRounds);
};

/**
 * Verify a password against a hash
 * @param password - Plain text password
 * @param hashedPassword - Stored hashed password
 * @returns True if password matches
 */
export const verifyPassword = async (
  password: string,
  hashedPassword: string,
): Promise<boolean> => {
  return bcrypt.compare(passwordWithPepper(password), hashedPassword);
};
