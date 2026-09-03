import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface SpinnerProps extends React.SVGAttributes<SVGSVGElement> {
  label?: string;
}

/**
 * Inline busy indicator. Purely decorative by default - announce the busy
 * state on the surrounding control (aria-busy / disabled) instead, or pass a
 * `label` when the spinner is the only thing on screen.
 */
export function Spinner({ className, label, ...props }: SpinnerProps) {
  return (
    <>
      <Loader2
        aria-hidden="true"
        className={cn("h-4 w-4 shrink-0 animate-spin", className)}
        {...props}
      />
      {label ? <span className="sr-only">{label}</span> : null}
    </>
  );
}
