import { cn } from "@/lib/utils";

/**
 * Shimmering placeholder that stands in for content while it loads. Size it
 * to match the real content so nothing jumps when the data lands.
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton rounded-[6px]", className)} {...props} />;
}

/**
 * A stack of text lines. The last line is shortened so the block reads like a
 * paragraph rather than a solid box.
 */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} className={cn("h-3", index === lines - 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}
