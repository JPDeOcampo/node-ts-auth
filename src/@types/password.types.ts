export interface UpdatePasswordDTO {
  id: string | string[] | undefined;
  currentPassword: string;
  newPassword: string;
}

export interface VerifyResetPWVerificationCodeDTO {
  email: string;
  verificationCode: string;
}

export interface RefreshResetPasswordCodeDTO {
  id: string;
  purpose: "password-reset";
  iat?: number;
  exp?: number;
}

export interface ResetPasswordDTO {
  emailParam: string | undefined;
  newPassword: string;
}