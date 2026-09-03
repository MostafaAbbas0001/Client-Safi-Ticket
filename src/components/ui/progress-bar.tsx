import { cn } from "@/lib/utils";

interface ProgressBarProps {
  active: boolean;
  className?: string;
  label?: string;
}

/**
 * Indeterminate progress bar for background work whose duration is unknown -
 * a refetch after a filter change, for example. It keeps its 2px of height at
 * all times so showing it never shifts the layout.
 */
export function ProgressBar({ active, className, label = "Loading" }: ProgressBarProps) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-busy={active}
      aria-valuetext={active ? "Loading" : "Idle"}
      className={cn(
        "h-0.5 w-full overflow-hidden rounded-full transition-opacity duration-200",
        active ? "progress-track opacity-100" : "opacity-0",
        className,
      )}
    />
  );
}
