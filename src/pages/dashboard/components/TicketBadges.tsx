import { getStatusBadgeClass } from "../dashboard-utils";

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex min-w-[84px] max-w-full items-center justify-center truncate rounded-[5px] border border-transparent px-2 py-1.5 text-[10px] font-semibold leading-none ${getStatusBadgeClass(status)}`}
    >
      <span className="truncate">{status}</span>
    </span>
  );
}
