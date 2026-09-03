import { memo, useEffect, useRef, useState } from "react";
import { CalendarRange, Check, Search } from "lucide-react";
import { MENU_DIVIDER, MENU_OPTION, MENU_OPTION_ACTIVE, MenuField } from "@/components/menu-field";
import { Skeleton } from "@/components/skeleton";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { OverviewChartsProps, ShareLabelProps, StatusFilterSectionProps } from "@/models";
import { getStatusChartColor } from "@/lib/ticket-status";
import { ALL_USERS } from "../dashboard-utils";

const fallbackDaily = [
  { date: "2026-08-31", count: 7 },
  { date: "2026-09-01", count: 14 },
  { date: "2026-09-02", count: 2 },
  { date: "2026-09-03", count: 0 },
  { date: "2026-09-04", count: 0 },
  { date: "2026-09-05", count: 0 },
  { date: "2026-09-06", count: 0 },
];
const fallbackStatuses = [
  { id: 1, name: "Initiated", count: 2 },
  { id: 2, name: "In Progress", count: 2 },
  { id: 3, name: "Closed", count: 19 },
  { id: 4, name: "Cancelled", count: 0 },
];

function dayLabel(value: string) {
  return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function statusGradient(name: string, color: string) {
  const normalized = name.toLowerCase().replace(/\s+/g, " ").trim();

  if (normalized === "closed") return { start: "#24bd83", end: "#07885b" };
  if (normalized === "in progress") return { start: "#4390ff", end: "#105fd8" };
  if (normalized === "initiated") return { start: "#8ca0b8", end: "#526981" };
  if (normalized === "cancelled" || normalized === "canceled") {
    return { start: "#f05267", end: "#c71936" };
  }

  return { start: color, end: color };
}

function shareLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: ShareLabelProps) {
  if (
    typeof cx !== "number" ||
    typeof cy !== "number" ||
    typeof midAngle !== "number" ||
    typeof innerRadius !== "number" ||
    typeof outerRadius !== "number" ||
    !percent ||
    percent < 0.08
  )
    return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const angle = (-midAngle * Math.PI) / 180;
  return (
    <text
      x={cx + radius * Math.cos(angle)}
      y={cy + radius * Math.sin(angle)}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="donut-percentage-label text-[12px] font-bold"
    >
      {Math.round(percent * 100)}%
    </text>
  );
}

const CHART_CARD =
  "rounded-card border border-line bg-surface p-5 shadow-card transition-shadow hover:shadow-card-hover";

/**
 * Bars of varying height read as "a chart is coming", where a blank panel or
 * placeholder numbers would read as real (and wrong) data.
 */
function ChartSkeletons() {
  const barHeights = [46, 78, 34, 62, 90, 52, 70];

  return (
    <div className="grid gap-4 xl:grid-cols-[1.18fr_1fr]" aria-busy="true">
      <span className="sr-only">Loading ticket overview</span>
      <section className={CHART_CARD}>
        <Skeleton className="h-3 w-40" />
        <div className="mt-5 flex h-[192px] items-end gap-3">
          {barHeights.map((height, index) => (
            <Skeleton
              key={index}
              className="flex-1 rounded-t-[2px]"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </section>

      <section className={CHART_CARD}>
        <Skeleton className="h-3 w-36" />
        <div className="mt-2 grid h-[205px] grid-cols-[44%_1fr] items-center gap-4">
          <Skeleton className="mx-auto aspect-square h-[172px] rounded-full" />
          <div className="space-y-3">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="flex items-center justify-between gap-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-6" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

const OverviewCharts = memo(function OverviewCharts({
  statusFilters,
  dailyTickets,
  totalCount,
  isLoading,
}: OverviewChartsProps) {
  const daily = (dailyTickets.length ? dailyTickets : fallbackDaily).map((item) => ({
    ...item,
    day: dayLabel(item.date),
  }));
  const baseStatuses = statusFilters.length ? statusFilters : fallbackStatuses;
  const total = totalCount || baseStatuses.reduce((sum, item) => sum + item.count, 0);
  const statusOrder = ["initiated", "in progress", "closed", "cancelled", "canceled"];
  const rows = [...baseStatuses]
    .sort((first, second) => {
      const firstIndex = statusOrder.indexOf(first.name.toLowerCase());
      const secondIndex = statusOrder.indexOf(second.name.toLowerCase());
      return (
        (firstIndex < 0 ? statusOrder.length : firstIndex) -
        (secondIndex < 0 ? statusOrder.length : secondIndex)
      );
    })
    .map((item) => {
      const color = getStatusChartColor(item.name);
      return {
        ...item,
        color,
        gradient: statusGradient(item.name, color),
        gradientId: `status-${item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      };
    });
  const pieRows = rows.filter((item) => item.count > 0);

  if (isLoading) {
    return <ChartSkeletons />;
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.18fr_1fr]">
      <section className={CHART_CARD}>
        <h2 className="text-[12px] font-semibold text-ink">Daily Tickets Created</h2>
        <div className="mt-3 h-[192px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={daily} margin={{ top: 5, right: 5, bottom: 0, left: -18 }}>
              <defs>
                <linearGradient id="daily-ticket-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4b91f7" />
                  <stop offset="52%" stopColor="#2c7ced" />
                  <stop offset="100%" stopColor="#146ef5" />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#e6ebf1" strokeDasharray="2 3" />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={{ stroke: "#dce4ec" }}
                tick={{ fontSize: 10, fill: "#63748a" }}
              />
              <YAxis
                domain={[0, 16]}
                ticks={[0, 4, 8, 12, 16]}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "#63748a" }}
              />
              <Tooltip
                cursor={{ fill: "#f4f7fb" }}
                contentStyle={{
                  border: "1px solid #dde4ec",
                  borderRadius: 7,
                  boxShadow: "0 4px 14px rgba(15,35,66,.08)",
                  fontSize: 11,
                }}
              />
              <Bar
                dataKey="count"
                fill="url(#daily-ticket-gradient)"
                radius={[2, 2, 0, 0]}
                maxBarSize={62}
                stroke="#1768dd"
                strokeWidth={0.4}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className={CHART_CARD}>
        <h2 className="text-[12px] font-semibold text-ink">Status Distribution</h2>
        <div className="mt-2 grid h-[205px] grid-cols-[44%_1fr] items-center gap-4">
          <div className="relative h-[184px] min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  {rows.map((item) => (
                    <linearGradient
                      key={item.gradientId}
                      id={item.gradientId}
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={item.gradient.start} />
                      <stop offset="100%" stopColor={item.gradient.end} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={pieRows}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="48%"
                  outerRadius="96%"
                  paddingAngle={0.6}
                  labelLine={false}
                  label={shareLabel}
                  isAnimationActive
                  animationBegin={80}
                  animationDuration={950}
                  animationEasing="ease-out"
                >
                  {pieRows.map((item) => (
                    <Cell
                      key={item.name}
                      fill={`url(#${item.gradientId})`}
                      stroke="#ffffff"
                      strokeWidth={0.75}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <strong className="text-[23px] font-semibold leading-none text-[#0f2342]">
                {total}
              </strong>
              <span className="mt-1.5 text-[12px] font-medium text-[#63748a]">Total</span>
            </div>
          </div>
          <div className="min-w-0 self-center">
            <div className="grid grid-cols-[1fr_42px] border-b border-[#e3e8ef] pb-2 text-[10px] font-medium text-[#63748a]">
              <span>Status</span>
              <span className="text-right">Count</span>
            </div>
            <div className="divide-y divide-[#e8edf2]">
              {rows.map((item) => (
                <div
                  key={item.name}
                  className="grid grid-cols-[1fr_42px] items-center py-2.5 text-[12px]"
                >
                  <span className="flex min-w-0 items-center gap-2 font-medium text-[#0f2342]">
                    <i
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        background: `linear-gradient(135deg, ${item.gradient.start}, ${item.gradient.end})`,
                      }}
                    />
                    <span className="truncate">{item.name}</span>
                  </span>
                  <span className="text-right tabular-nums text-[#4e627b]">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
});

export function StatusFilterSection(props: StatusFilterSectionProps) {
  const {
    statusFilters,
    dailyTickets,
    totalCount,
    isLoading,
    search,
    userFilter,
    statusFilterIds,
    showUserFilter,
    users,
    statuses,
    startDate,
    endDate,
    onSearchChange,
    onUserChange,
    onStatusChange,
    onStartDateChange,
    onEndDateChange,
  } = props;
  const [statusOpen, setStatusOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const selected = new Set(statusFilterIds);
  const selectedStatusNames = statuses
    .filter((status) => selected.has(status.id))
    .map((status) => status.name);
  const statusLabel =
    selectedStatusNames.length === 0
      ? "All statuses"
      : selectedStatusNames.length === 1
        ? selectedStatusNames[0]
        : `${selectedStatusNames.length} statuses`;
  const userLabel =
    userFilter === ALL_USERS
      ? "All users"
      : (users.find((item) => String(item.id) === userFilter)?.name ?? "All users");

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!statusRef.current?.contains(event.target as Node)) setStatusOpen(false);
      if (!userRef.current?.contains(event.target as Node)) setUserOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const toggleStatus = (statusId: number) => {
    const nextSelected = new Set(statusFilterIds);

    if (nextSelected.has(statusId)) {
      nextSelected.delete(statusId);
    } else {
      nextSelected.add(statusId);
    }

    onStatusChange(
      statuses.filter((status) => nextSelected.has(status.id)).map((status) => status.id),
    );
  };

  return (
    <>
      <OverviewCharts
        statusFilters={statusFilters}
        dailyTickets={dailyTickets}
        totalCount={totalCount}
        isLoading={isLoading}
      />
      <section
        className={`mt-4 grid gap-3 rounded-card border border-line bg-surface p-3 shadow-card ${showUserFilter ? "xl:grid-cols-[minmax(200px,1fr)_minmax(110px,155px)_minmax(110px,155px)_minmax(110px,150px)_minmax(110px,155px)]" : "xl:grid-cols-[minmax(200px,1fr)_minmax(110px,155px)_minmax(110px,155px)_minmax(110px,150px)]"}`}
      >
        <label className="space-y-1">
          <span className="block text-[10px] font-medium text-[#63748a]">Search</span>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#718197]" />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Title, ID, requester, or body"
              className="h-9 w-full rounded-field border border-[#d9e1ea] bg-surface pl-9 pr-3 text-[11px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-[#7a8ba1] hover:border-[#c5d1dd] focus:border-brand focus:ring-2 focus:ring-brand-ring"
            />
          </div>
        </label>
        <label className="space-y-1">
          <span className="block text-[10px] font-medium text-[#63748a]">From</span>
          <div className="relative">
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="h-9 w-full rounded-field border border-[#d9e1ea] bg-surface px-3 text-[11px] font-medium text-[#263b59] outline-none transition-[border-color,box-shadow] hover:border-[#c5d1dd] focus:border-brand focus:ring-2 focus:ring-brand-ring"
            />
            <CalendarRange
              size={13}
              className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 text-[#435874]"
            />
          </div>
        </label>
        <label className="space-y-1">
          <span className="block text-[10px] font-medium text-[#63748a]">To</span>
          <div className="relative">
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="h-9 w-full rounded-field border border-[#d9e1ea] bg-surface px-3 text-[11px] font-medium text-[#263b59] outline-none transition-[border-color,box-shadow] hover:border-[#c5d1dd] focus:border-brand focus:ring-2 focus:ring-brand-ring"
            />
            <CalendarRange
              size={13}
              className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 text-[#435874]"
            />
          </div>
        </label>
        <MenuField
          label="Status"
          value={statusLabel}
          open={statusOpen}
          onToggle={() => setStatusOpen(!statusOpen)}
          fieldRef={statusRef}
        >
          <button
            type="button"
            onClick={() => {
              onStatusChange([]);
              setStatusOpen(false);
            }}
            className={`${MENU_OPTION} ${!statusFilterIds.length ? MENU_OPTION_ACTIVE : ""}`}
          >
            All statuses
            {!statusFilterIds.length && <Check size={14} className="shrink-0" />}
          </button>
          <div className={MENU_DIVIDER} />
          {statuses.map((item) => (
            <label key={item.id} className={MENU_OPTION}>
              <span className="flex min-w-0 items-center gap-2">
                <input
                  type="checkbox"
                  checked={selected.has(item.id)}
                  onChange={() => toggleStatus(item.id)}
                  className="h-3.5 w-3.5 shrink-0 rounded border-[#c9d4e0] accent-brand"
                />
                <span className="truncate">{item.name}</span>
              </span>
            </label>
          ))}
        </MenuField>
        {showUserFilter && (
          <MenuField
            label="Assignee"
            value={userLabel}
            open={userOpen}
            onToggle={() => setUserOpen(!userOpen)}
            fieldRef={userRef}
          >
            <button
              type="button"
              onClick={() => {
                onUserChange(ALL_USERS);
                setUserOpen(false);
              }}
              className={`${MENU_OPTION} ${userFilter === ALL_USERS ? MENU_OPTION_ACTIVE : ""}`}
            >
              All users
              {userFilter === ALL_USERS && <Check size={14} className="shrink-0" />}
            </button>
            <div className={MENU_DIVIDER} />
            {users.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onUserChange(String(item.id));
                  setUserOpen(false);
                }}
                className={`${MENU_OPTION} ${userFilter === String(item.id) ? MENU_OPTION_ACTIVE : ""}`}
              >
                <span className="truncate">{item.name}</span>
                {userFilter === String(item.id) && <Check size={14} className="shrink-0" />}
              </button>
            ))}
          </MenuField>
        )}
      </section>
    </>
  );
}
