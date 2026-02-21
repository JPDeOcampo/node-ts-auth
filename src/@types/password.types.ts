export interface UpdatePasswordDTO {
  id: string | string[] | undefined;
  currentPassword: string;
  newPassword: string;
}

export interface VerifyResetPWVerificationCodeDTO {
  email: string;
  verificationCode: string;
}