import { getStatusBadgeClass, getStatusChartColor } from "@/lib/ticket-status";
import type { StatusBadgeProps } from "@/models";

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex min-w-[84px] max-w-full items-center justify-center gap-1.5 truncate rounded-[5px] border px-2 py-1.5 text-[10px] font-semibold leading-none ${getStatusBadgeClass(status)}`}
    >
      <i
        aria-hidden="true"
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: getStatusChartColor(status) }}
      />
      <span className="truncate">{status}</span>
    </span>
  );
}
