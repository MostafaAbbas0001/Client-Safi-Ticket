import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[60px] w-full rounded-field border border-[#d9e1ea] bg-surface px-3 py-2 text-base text-ink shadow-[0_1px_1px_rgba(15,35,66,0.03)] transition-[border-color,box-shadow] placeholder:text-ink-subtle hover:border-[#c5d1dd] focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring disabled:cursor-not-allowed disabled:bg-[#f4f6f8] disabled:opacity-60 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
