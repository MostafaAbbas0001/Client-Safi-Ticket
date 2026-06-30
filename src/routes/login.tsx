import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, KeyRound, Mail, Ticket } from "lucide-react";
import { forgotPassword, resetPassword } from "@/api/authApi";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in - Helpdesk" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetStarted, setResetStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [resetting, setResetting] = useState(false);

  if (user) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/officer"} />;
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setResetMessage(null);

    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      const signedInUser = await login(email, password);

      if (!signedInUser) {
        setError("Invalid email or password.");
        return;
      }

      toast.success(`Welcome back, ${signedInUser.name.split(" ")[0]}`);
      navigate({ to: signedInUser.role === "admin" ? "/admin" : "/officer" });
    } catch (err) {
      console.error("Login failed:", err);
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
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
      setSendingCode(true);
      const message = await forgotPassword(email.trim());
      setResetStarted(true);
      setResetMessage(message);
      toast.success("Reset code sent");
    } catch (err) {
      console.error("Forgot password failed:", err);
      setError(err instanceof Error ? err.message : "Failed to send reset code.");
    } finally {
      setSendingCode(false);
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
      setResetting(true);
      const message = await resetPassword({
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
      toast.success("Password reset successfully");
    } catch (err) {
      console.error("Password reset failed:", err);
      setError(err instanceof Error ? err.message : "Failed to reset password.");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Ticket className="h-5 w-5" />
          </div>
          <h1 className="mt-3 text-2xl font-semibold">Helpdesk</h1>
          <p className="text-sm text-muted-foreground">Sign in to your dashboard</p>
        </div>

        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@company.com"
                  autoComplete="username"
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
                />

                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="flex gap-2">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-medium">Forgot your password?</p>
                          <p className="text-xs leading-5 text-muted-foreground">
                            We will verify your email and send a 6-digit reset code.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={onSendResetCode}
                          disabled={sendingCode || loading || resetting}
                          className="shrink-0 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-primary shadow-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {sendingCode ? "Sending..." : resetStarted ? "Resend code" : "Send code"}
                        </button>
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
                                placeholder="6-digit code"
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
                            disabled={resetting || sendingCode || loading}
                          >
                            <KeyRound className="mr-2 h-4 w-4" />
                            {resetting ? "Resetting..." : "Reset password"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              {resetMessage && (
                <div className="flex gap-2 rounded-md border border-primary/20 bg-primary/10 px-3 py-2 text-sm text-primary">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{resetMessage}</p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading || resetting}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-5 rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            Use the email and password from the Users table. Staff accounts created by the
            admin will open the staff dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
