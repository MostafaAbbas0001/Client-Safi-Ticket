import { BadgeCheck } from "lucide-react";
import type { LoginFeedbackProps } from "@/models";

export function LoginFeedback({ error, message }: LoginFeedbackProps) {
  return (
    <>
      {error && (
        <p
          role="alert"
          className="animate-rise rounded-field bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      {message && (
        <div
          role="status"
          className="animate-rise flex gap-2 rounded-field border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground"
        >
          <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{message}</p>
        </div>
      )}
    </>
  );
}
