export interface PasswordResetSectionProps {
  resetStarted: boolean;
  resetCode: string;
  newPassword: string;
  confirmPassword: string;
  isBusy: boolean;
  isSendingCode: boolean;
  isResettingPassword: boolean;
  onResetCodeChange: (code: string) => void;
  onNewPasswordChange: (password: string) => void;
  onConfirmPasswordChange: (password: string) => void;
  onSendCode: () => void;
  onResetPassword: () => void;
}
