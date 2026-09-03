import { useState, type FormEvent } from "react";
import { BadgeCheck, KeyRound, LogIn, Mail } from "lucide-react";
import { toast } from "sonner";
import { safiLogoUrl } from "@/assets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useForgotPasswordMutation,
  useLoginMutation,
  useResetPasswordMutation,
} from "@/queries/auth.queries";
import { ApiError } from "@/services/api-client";
import type { AuthSession } from "@/services/auth.service";

interface LoginPageProps {
  onLogin: (session: AuthSession) => void;
}

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

  const getErrorMessage = (unknownError: unknown, fallback: string) => {
    if (unknownError instanceof ApiError) {
      return unknownError.message;
    }

    if (unknownError instanceof Error) {
      return unknownError.message;
    }

    return fallback;
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
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
      setError(getErrorMessage(unknownError, "Invalid email or password."));
    }
  };

  const onSendResetCode = async () => {
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
      setError(getErrorMessage(unknownError, "Failed to send reset code."));
    }
  };

  const onResetPassword = async () => {
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
      setError(getErrorMessage(unknownError, "Failed to reset password."));
    }
  };

  const isBusy =
    loginMutation.isPending || forgotPasswordMutation.isPending || resetPasswordMutation.isPending;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
        <div className="animate-rise w-full max-w-[440px]">
          <form
            onSubmit={onSubmit}
            className="rounded-card border border-line bg-card p-5 shadow-card sm:p-6"
          >
            <div className="mb-6 flex justify-center border-b border-line-soft pb-5">
              <img
                src={safiLogoUrl}
                alt="Safi Ticketing System"
                className="h-auto w-full max-w-[280px] object-contain"
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@company.com"
                  autoComplete="username"
                  disabled={isBusy}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  autoComplete="current-password"
                  disabled={isBusy}
                  className="h-10"
                />
              </div>

              <div className="rounded-field border border-line-soft bg-muted/40 p-3">
                <div className="flex gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium">Forgot your password?</p>
                        <p className="text-xs leading-5 text-muted-foreground">
                          Receive a reset code for this account.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onSendResetCode}
                        loading={forgotPasswordMutation.isPending}
                        loadingText="Sending..."
                        disabled={isBusy}
                      >
                        {resetStarted ? "Resend" : "Send code"}
                      </Button>
                    </div>

                    {resetStarted && (
                      <div className="animate-rise mt-4 space-y-3 border-t border-line-soft pt-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="reset-code">Reset code</Label>
                            <Input
                              id="reset-code"
                              value={resetCode}
                              onChange={(event) => setResetCode(event.target.value)}
                              placeholder="123456"
                              inputMode="numeric"
                              autoComplete="one-time-code"
                              disabled={isBusy}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="new-password">New password</Label>
                            <Input
                              id="new-password"
                              type="password"
                              value={newPassword}
                              onChange={(event) => setNewPassword(event.target.value)}
                              placeholder="New password"
                              autoComplete="new-password"
                              disabled={isBusy}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm password</Label>
                            <Input
                              id="confirm-password"
                              type="password"
                              value={confirmPassword}
                              onChange={(event) => setConfirmPassword(event.target.value)}
                              placeholder="Confirm password"
                              autoComplete="new-password"
                              disabled={isBusy}
                            />
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={onResetPassword}
                          loading={resetPasswordMutation.isPending}
                          loadingText="Resetting password..."
                          disabled={isBusy}
                        >
                          <KeyRound className="h-4 w-4" />
                          Reset password
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {error && (
                <p
                  role="alert"
                  className="animate-rise rounded-field bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {error}
                </p>
              )}

              {resetMessage && (
                <div
                  role="status"
                  className="animate-rise flex gap-2 rounded-field border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground"
                >
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{resetMessage}</p>
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="h-10 w-full"
                loading={loginMutation.isPending}
                loadingText="Signing in..."
                disabled={isBusy}
              >
                <LogIn className="h-4 w-4" />
                Sign in
              </Button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
