import type { FormEvent } from "react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/button";
import type { LoginFormProps } from "@/models";
import { LoginBrand } from "./branding/LoginBrand";
import { LoginCredentials } from "./credentials/LoginCredentials";
import { LoginFeedback } from "./feedback/LoginFeedback";
import { PasswordResetSection } from "./password-reset/PasswordResetSection";

export function LoginForm({
  email,
  password,
  resetCode,
  newPassword,
  confirmPassword,
  resetStarted,
  error,
  resetMessage,
  isBusy,
  isSigningIn,
  isSendingResetCode,
  isResettingPassword,
  onEmailChange,
  onPasswordChange,
  onResetCodeChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
  onSendResetCode,
  onResetPassword,
}: LoginFormProps) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-card border border-line bg-card p-5 shadow-card sm:p-6"
    >
      <LoginBrand />

      <div className="space-y-4">
        <LoginCredentials
          email={email}
          password={password}
          disabled={isBusy}
          onEmailChange={onEmailChange}
          onPasswordChange={onPasswordChange}
        />
        <PasswordResetSection
          resetStarted={resetStarted}
          resetCode={resetCode}
          newPassword={newPassword}
          confirmPassword={confirmPassword}
          isBusy={isBusy}
          isSendingCode={isSendingResetCode}
          isResettingPassword={isResettingPassword}
          onResetCodeChange={onResetCodeChange}
          onNewPasswordChange={onNewPasswordChange}
          onConfirmPasswordChange={onConfirmPasswordChange}
          onSendCode={onSendResetCode}
          onResetPassword={onResetPassword}
        />
        <LoginFeedback error={error} message={resetMessage} />
        <Button
          type="submit"
          size="lg"
          className="h-10 w-full"
          loading={isSigningIn}
          loadingText="Signing in..."
          disabled={isBusy}
        >
          <LogIn className="h-4 w-4" />
          Sign in
        </Button>
      </div>
    </form>
  );
}
