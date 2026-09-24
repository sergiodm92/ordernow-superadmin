export interface ChangePasswordWith2FAFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface VerifyChangePasswordCodeFormValues {
  code: string;
}

export type ChangePasswordStep = 'password' | 'verify' | 'success';
