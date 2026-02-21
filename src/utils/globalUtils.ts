import crypto from "crypto";

export const generate6DigitCode = (): string => {
  const num = crypto.randomInt(100000, 1000000); // 100000 ≤ num < 1000000
  return num.toString();
};