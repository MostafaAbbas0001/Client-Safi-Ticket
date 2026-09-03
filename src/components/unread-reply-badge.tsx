import { cn } from "@/lib/utils";
import type { UnreadReplyBadgeProps } from "@/models";

/**
 * Compact "something new landed" marker - a dot plus a number, not a pill of
 * prose. Renders inline-block so it can sit directly in front of a ticket
 * title as part of the same text flow (not a flex sibling, which stretches
 * unpredictably against short titles) and truncates naturally with it under
 * `line-clamp`. The full "N new replies" wording lives in the tooltip/
 * aria-label instead of on screen.
 */
export function UnreadReplyBadge({ count, className }: UnreadReplyBadgeProps) {
  const label = count > 1 ? `${count} new replies` : "New reply";

  return (
    <span
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex h-[18px] items-center gap-1 whitespace-nowrap rounded-full bg-brand-soft align-middle pl-1.5 pr-2 text-[9px] font-bold leading-none text-brand",
        className,
      )}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
      {count > 1 ? count : "New"}
    </span>
  );
}
