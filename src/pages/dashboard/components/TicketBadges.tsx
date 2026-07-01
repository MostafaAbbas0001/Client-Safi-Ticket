import { getPriorityBadgeClass, getStatusBadgeClass } from "../dashboard-utils";

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex w-28 max-w-full items-center justify-center truncate rounded-full border px-2.5 py-1 text-xs font-semibold leading-none ${getStatusBadgeClass(status)}`}
    >
      <span className="truncate">{status}</span>
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span
      className={`inline-flex w-28 max-w-full items-center justify-center truncate rounded-full border px-2.5 py-1 text-xs font-semibold leading-none ${getPriorityBadgeClass(priority)}`}
    >
      <span className="truncate">{priority}</span>
    </span>
  );
}
