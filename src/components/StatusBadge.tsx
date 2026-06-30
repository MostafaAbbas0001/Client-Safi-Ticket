import type { TicketStatus } from "@/lib/mock-data";

const STYLES: Record<TicketStatus, string> = {
  New: "border-indigo-200 bg-indigo-50 text-indigo-700",
  Open: "border-amber-200 bg-amber-50 text-amber-700",
  "In Progress": "border-sky-200 bg-sky-50 text-sky-700",
  Resolved: "border-teal-200 bg-teal-50 text-teal-700",
  Closed: "border-slate-300 bg-slate-100 text-slate-700",
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {status}
    </span>
  );
}
