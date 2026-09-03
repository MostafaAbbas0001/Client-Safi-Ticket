export interface LoginFormProps {
  email: string;
  password: string;
  resetCode: string;
  newPassword: string;
  confirmPassword: string;
  resetStarted: boolean;
  error: string | null;
  resetMessage: string | null;
  isBusy: boolean;
  isSigningIn: boolean;
  isSendingResetCode: boolean;
  isResettingPassword: boolean;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onResetCodeChange: (code: string) => void;
  onNewPasswordChange: (password: string) => void;
  onConfirmPasswordChange: (password: string) => void;
  onSubmit: () => void;
  onSendResetCode: () => void;
  onResetPassword: () => void;
}
