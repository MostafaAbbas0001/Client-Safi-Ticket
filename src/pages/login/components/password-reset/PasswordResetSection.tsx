import { KeyRound, Mail } from "lucide-react";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import type { PasswordResetSectionProps } from "@/models";

export function PasswordResetSection({
  resetStarted,
  resetCode,
  newPassword,
  confirmPassword,
  isBusy,
  isSendingCode,
  isResettingPassword,
  onResetCodeChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onSendCode,
  onResetPassword,
}: PasswordResetSectionProps) {
  return (
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
              onClick={onSendCode}
              loading={isSendingCode}
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
                    onChange={(event) => onResetCodeChange(event.target.value)}
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
                    onChange={(event) => onNewPasswordChange(event.target.value)}
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
                    onChange={(event) => onConfirmPasswordChange(event.target.value)}
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
                loading={isResettingPassword}
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
  );
}
