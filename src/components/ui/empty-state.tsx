import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * "Nothing here" placeholder. Always says what is missing and, where there is
 * one, offers the next step - a bare sentence leaves people guessing whether
 * something broke.
 */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
        className,
      )}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface-muted text-ink-subtle [&_svg]:h-5 [&_svg]:w-5">
        {icon}
      </span>
      <div className="space-y-1">
        <p className="text-[13px] font-semibold text-ink">{title}</p>
        {description ? (
          <p className="max-w-[38ch] text-[11px] leading-5 text-ink-muted">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
