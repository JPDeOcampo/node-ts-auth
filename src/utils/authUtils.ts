import bcrypt from 'bcrypt';

const pepper: string = process.env.PEPPER || 'yourSecretPepper';
const saltRounds: number = 12;

/**
 * Hash a password with pepper
 * @param password - Plain text password
 * @returns Hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
    const passwordWithPepper = password + pepper;
    return bcrypt.hash(passwordWithPepper, saltRounds);
}

/**
 * Verify a password against a hash
 * @param password - Plain text password
 * @param hashedPassword - Stored hashed password
 * @returns True if password matches
 */
export const verifyPassword = async (
    password: string,
    hashedPassword: string
): Promise<boolean> => {
    const passwordWithPepper = password + pepper;
    return bcrypt.compare(passwordWithPepper, hashedPassword);
}