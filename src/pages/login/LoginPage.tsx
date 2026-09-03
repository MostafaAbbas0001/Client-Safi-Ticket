import { useState } from "react";
import { toast } from "sonner";
import {
  useForgotPasswordMutation,
  useLoginMutation,
  useResetPasswordMutation,
} from "@/queries/auth.queries";
import type { LoginPageProps } from "@/models";
import { LoginForm } from "./components/LoginForm";
import { getLoginErrorMessage } from "./login-utils";

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetStarted, setResetStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const loginMutation = useLoginMutation();
  const forgotPasswordMutation = useForgotPasswordMutation();
  const resetPasswordMutation = useResetPasswordMutation();

  const submitLogin = async () => {
    setError(null);
    setResetMessage(null);

    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      const session = await loginMutation.mutateAsync({
        email: email.trim(),
        password,
      });

      toast.success("Signed in");
      onLogin(session);
    } catch (unknownError) {
      setError(getLoginErrorMessage(unknownError, "Invalid email or password."));
    }
  };

  const sendResetCode = async () => {
    setError(null);
    setResetMessage(null);

    if (!email.trim()) {
      setError("Enter your email first, then send the reset code.");
      return;
    }

    try {
      const message = await forgotPasswordMutation.mutateAsync(email.trim());

      setResetStarted(true);
      setResetMessage(message);
      toast.success("Reset code sent");
    } catch (unknownError) {
      setError(getLoginErrorMessage(unknownError, "Failed to send reset code."));
    }
  };

  const resetPassword = async () => {
    setError(null);
    setResetMessage(null);

    if (!email.trim() || !resetCode.trim()) {
      setError("Email and reset code are required.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const message = await resetPasswordMutation.mutateAsync({
        email: email.trim(),
        token: resetCode.trim(),
        newPassword,
      });

      setPassword("");
      setResetCode("");
      setNewPassword("");
      setConfirmPassword("");
      setResetStarted(false);
      setResetMessage(message);
      toast.success("Password reset completed");
    } catch (unknownError) {
      setError(getLoginErrorMessage(unknownError, "Failed to reset password."));
    }
  };

  const isBusy =
    loginMutation.isPending || forgotPasswordMutation.isPending || resetPasswordMutation.isPending;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
        <div className="animate-rise w-full max-w-[440px]">
          <LoginForm
            email={email}
            password={password}
            resetCode={resetCode}
            newPassword={newPassword}
            confirmPassword={confirmPassword}
            resetStarted={resetStarted}
            error={error}
            resetMessage={resetMessage}
            isBusy={isBusy}
            isSigningIn={loginMutation.isPending}
            isSendingResetCode={forgotPasswordMutation.isPending}
            isResettingPassword={resetPasswordMutation.isPending}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onResetCodeChange={setResetCode}
            onNewPasswordChange={setNewPassword}
            onConfirmPasswordChange={setConfirmPassword}
            onSubmit={() => void submitLogin()}
            onSendResetCode={() => void sendResetCode()}
            onResetPassword={() => void resetPassword()}
          />
        </div>
      </div>
    </main>
  );
}
