import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { Spinner } from "@/components/spinner";
import { cn } from "@/lib/utils";
import type { ButtonProps } from "@/models";

const buttonVariants = cva(
  "relative inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-field text-[12px] font-semibold transition-[color,background-color,border-color,box-shadow,transform] duration-150 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-busy:cursor-progress [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-brand text-white shadow-[0_1px_2px_rgba(15,35,66,0.08)] hover:bg-brand-strong hover:shadow-[0_2px_8px_rgba(20,110,245,0.28)]",
        destructive:
          "bg-danger text-white hover:bg-danger-strong hover:shadow-[0_2px_8px_rgba(217,31,55,0.26)]",
        success:
          "bg-success text-white hover:bg-success-strong hover:shadow-[0_2px_8px_rgba(19,166,109,0.26)]",
        outline:
          "border border-line bg-surface text-[#304760] hover:border-[#c5d1dd] hover:bg-surface-muted hover:text-ink",
        secondary: "bg-[#edf2f7] text-[#263b59] hover:bg-[#e3eaf2]",
        ghost: "text-[#3e536d] hover:bg-[#f1f5f9] hover:text-ink",
        link: "text-brand underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-[11px]",
        lg: "h-10 px-8 text-[13px]",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      loadingText,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    if (asChild) {
      return (
        <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
          {children}
        </Comp>
      );
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <>
            <Spinner />
            {loadingText ?? children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button };
