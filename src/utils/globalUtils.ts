import crypto from "crypto";

export const generate5DigitCode = (): string => {
  const num = crypto.randomInt(10000, 100000); // 10000 ≤ num < 100000
  return num.toString();
};