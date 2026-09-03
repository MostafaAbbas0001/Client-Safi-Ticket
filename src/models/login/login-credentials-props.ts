export interface LoginCredentialsProps {
  email: string;
  password: string;
  disabled: boolean;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
}
