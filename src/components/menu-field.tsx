import { ChevronDown } from "lucide-react";

import { Spinner } from "@/components/spinner";
import { cn } from "@/lib/utils";
import type { MenuFieldProps } from "@/models";

/**
 * Trigger button + floating panel shared by every "choose one from a list"
 * dropdown in the app (status/assignee filters, ticket assignee picker) so
 * they all look and behave the same instead of drifting apart.
 */
export function MenuField({
  label,
  value,
  open,
  onToggle,
  children,
  fieldRef,
  id,
  disabled = false,
  loading = false,
  className,
  menuClassName,
}: MenuFieldProps) {
  const isDisabled = disabled || loading;

  return (
    <div ref={fieldRef} className={cn("relative space-y-1", className)}>
      {label && <span className="block text-[10px] font-medium text-[#63748a]">{label}</span>}
      <button
        id={id}
        type="button"
        onClick={onToggle}
        disabled={isDisabled}
        aria-expanded={open}
        aria-busy={loading || undefined}
        className={cn(
          "flex h-9 w-full cursor-pointer items-center justify-between rounded-field border bg-surface px-3 text-[11px] font-medium text-[#263b59] shadow-[0_1px_1px_rgba(15,35,66,0.03)] transition-[border-color,box-shadow] hover:border-[#c5d1dd] focus:outline-none focus:ring-2 focus:ring-brand-ring disabled:cursor-not-allowed disabled:bg-[#f4f6f8] disabled:opacity-60",
          open ? "border-brand" : "border-[#d9e1ea]",
        )}
      >
        <span className="truncate">{value}</span>
        {loading ? (
          <Spinner className="h-3.5 w-3.5 shrink-0 text-brand" label="Loading" />
        ) : (
          <ChevronDown
            size={14}
            className={`shrink-0 text-[#61738a] transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>
      {open && (
        <div
          className={cn(
            "animate-rise absolute left-0 right-0 top-full z-40 mt-1.5 max-h-64 overflow-y-auto rounded-card border border-line bg-surface p-1.5 shadow-overlay",
            menuClassName,
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export const MENU_OPTION =
  "flex w-full cursor-pointer items-center justify-between gap-2 rounded-[6px] px-2.5 py-2 text-left text-[11px] font-medium text-[#344a64] transition-colors hover:bg-surface-muted hover:text-ink";
export const MENU_OPTION_ACTIVE = "bg-brand-soft text-brand hover:bg-brand-soft hover:text-brand";
export const MENU_DIVIDER = "my-1 h-px bg-line-soft";
