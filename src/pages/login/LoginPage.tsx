import { useState, type FormEvent } from "react";
import { CheckCircle2, KeyRound, Mail } from "lucide-react";
import { toast } from "sonner";
import { safiLogoUrl } from "@/assets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api-client";
import { authService, type AuthSession } from "@/lib/auth-service";

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
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSendingResetCode, setIsSendingResetCode] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

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
      setIsSigningIn(true);
      const session = await authService.login({
        email: email.trim(),
        password,
      });

      toast.success("Signed in");
      onLogin(session);
    } catch (unknownError) {
      setError(getErrorMessage(unknownError, "Invalid email or password."));
    } finally {
      setIsSigningIn(false);
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
      setIsSendingResetCode(true);
      const message = await authService.forgotPassword(email.trim());

      setResetStarted(true);
      setResetMessage(message);
      toast.success("Reset code sent");
    } catch (unknownError) {
      setError(getErrorMessage(unknownError, "Failed to send reset code."));
    } finally {
      setIsSendingResetCode(false);
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
      setIsResettingPassword(true);
      const message = await authService.resetPassword(email.trim(), resetCode.trim(), newPassword);

      setPassword("");
      setResetCode("");
      setNewPassword("");
      setConfirmPassword("");
      setResetStarted(false);
      setResetMessage(message);
      toast.success("Password reset completed");
    } catch (unknownError) {
      setError(getErrorMessage(unknownError, "Failed to reset password."));
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-[440px]">
          <form onSubmit={onSubmit} className="rounded-md border bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex justify-center border-b pb-5">
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
                  className="h-10"
                />
              </div>

              <div className="rounded-md border bg-muted/40 p-3">
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
                        disabled={isSendingResetCode}
                      >
                        {isSendingResetCode ? "Sending..." : resetStarted ? "Resend" : "Send code"}
                      </Button>
                    </div>

                    {resetStarted && (
                      <div className="mt-4 space-y-3 border-t pt-4">
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
                            />
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={onResetPassword}
                          disabled={isResettingPassword}
                        >
                          <KeyRound className="mr-2 h-4 w-4" />
                          {isResettingPassword ? "Resetting..." : "Reset password"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              {resetMessage && (
                <div className="flex gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{resetMessage}</p>
                </div>
              )}

              <Button type="submit" className="h-10 w-full" disabled={isSigningIn}>
                {isSigningIn ? "Signing in..." : "Sign in"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
