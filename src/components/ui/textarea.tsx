import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[60px] w-full rounded-[7px] border border-[#d9e1ea] bg-white px-3 py-2 text-base text-[#102445] placeholder:text-[#8190a2] focus-visible:border-[#146ef5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146ef5]/15 disabled:cursor-not-allowed disabled:bg-[#f4f6f8] disabled:opacity-60 md:text-sm",
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
