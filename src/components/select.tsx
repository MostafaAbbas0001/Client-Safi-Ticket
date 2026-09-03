import * as React from "react";
import { ChevronDown } from "lucide-react";

import { Spinner } from "@/components/spinner";
import { cn } from "@/lib/utils";
import type { SelectProps } from "@/models";

/**
 * Styled wrapper around the native <select>. `appearance-none` strips the
 * browser's own arrow so a single icon ever renders on the right - swapped
 * for a spinner while `loading`, instead of stacking a spinner on top of the
 * native arrow.
 */
const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, loading = false, disabled, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          disabled={disabled || loading}
          aria-busy={loading || undefined}
          className={cn(
            "h-9 w-full cursor-pointer appearance-none rounded-field border border-[#d9e1ea] bg-surface px-3 pr-9 text-sm text-ink shadow-[0_1px_1px_rgba(15,35,66,0.03)] outline-none transition-[border-color,box-shadow] hover:border-[#c5d1dd] focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring disabled:cursor-not-allowed disabled:bg-[#f4f6f8] disabled:opacity-60 md:text-sm",
            className,
          )}
          {...props}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted">
          {loading ? (
            <Spinner className="h-3.5 w-3.5 text-brand" label="Loading" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
          )}
        </span>
      </div>
    );
  },
);
Select.displayName = "Select";

export { Select };
