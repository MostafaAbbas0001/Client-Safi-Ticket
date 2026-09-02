import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-[7px] border border-[#d9e1ea] bg-white px-3 py-1 text-base text-[#102445] transition-[border-color,box-shadow] file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#304760] placeholder:text-[#8190a2] focus-visible:border-[#146ef5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146ef5]/15 disabled:cursor-not-allowed disabled:bg-[#f4f6f8] disabled:opacity-60 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
