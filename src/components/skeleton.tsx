import { cn } from "@/lib/utils";
import type { SkeletonProps } from "@/models";

/**
 * Shimmering placeholder that stands in for content while it loads. Size it
 * to match the real content so nothing jumps when the data lands.
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return <div className={cn("skeleton rounded-[6px]", className)} {...props} />;
}
