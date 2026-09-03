import { getStatusBadgeClass, getStatusChartColor } from "../dashboard-utils";

export function StatusBadge({ status }: { status: string }) {
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
