import { getStatusAccentClass } from "../dashboard-utils";
import type { OverviewTimeFrame } from "@/lib/overview-service";

export interface StatusFilterItem {
  id: number;
  name: string;
  count: number;
}

interface StatusFilterSectionProps {
  statusFilters: StatusFilterItem[];
  totalCount: number;
  timeFrame: OverviewTimeFrame;
  onTimeFrameChange: (value: OverviewTimeFrame) => void;
}

const timeFrameOptions: Array<{ value: OverviewTimeFrame; label: string }> = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];

export function StatusFilterSection({
  statusFilters,
  totalCount,
  timeFrame,
  onTimeFrameChange,
}: StatusFilterSectionProps) {
  return (
    <section className="rounded-lg border bg-card/95 p-4 shadow-[0_16px_45px_rgba(15,15,15,0.05)]">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase text-muted-foreground">Queue health</p>
          <h2 className="mt-1 text-xl font-semibold tracking-normal">Ticket status</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs text-muted-foreground">
            {totalCount} {totalCount === 1 ? "ticket" : "tickets"} in selected range
          </p>
          <select
            value={timeFrame}
            onChange={(event) => onTimeFrameChange(event.target.value as OverviewTimeFrame)}
            className="h-9 rounded-md border border-input bg-background/80 px-3 py-1 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
          >
            {timeFrameOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statusFilters.map((item) => {
          const percentage = totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0;

          return (
            <article
              key={item.id || item.name}
              className={`min-h-20 rounded-lg border border-t-2 bg-background/85 p-3 ${getStatusAccentClass(item.name)}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="truncate text-sm font-semibold">{item.name}</p>
                  <p className="mt-1 text-2xl font-semibold tracking-normal">{item.count}</p>
                </div>
                <span className="text-xs font-medium text-muted-foreground">{percentage}%</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="status-progress h-full rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
