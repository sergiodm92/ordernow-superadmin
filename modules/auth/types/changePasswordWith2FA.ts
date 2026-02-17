export interface ChangePasswordWith2FAFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface VerifyChangePasswordCodeFormValues {
  code: string;
}

export type ChangePasswordStep = 'password' | 'verify' | 'success';

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface VerifyChangePasswordRequest {
  code: string;
  newPassword: string;
}
