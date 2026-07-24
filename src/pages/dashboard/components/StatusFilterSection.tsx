import { memo, useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Input } from "@/components/ui/input";
import type { LookupItem, UserLookupItem } from "../dashboard-data";
import { ALL_USERS, getStatusChartColor } from "../dashboard-utils";

export interface StatusFilterItem {
  id: number;
  name: string;
  count: number;
}

interface DailyTicketItem {
  date: string;
  count: number;
}

interface StatusFilterSectionProps {
  statusFilters: StatusFilterItem[];
  dailyTickets: DailyTicketItem[];
  totalCount: number;
  search: string;
  userFilter: string;
  statusFilterIds: number[];
  showUserFilter: boolean;
  users: UserLookupItem[];
  statuses: LookupItem[];
  startDate: string;
  endDate: string;
  onSearchChange: (value: string) => void;
  onUserChange: (value: string) => void;
  onStatusChange: (value: number[]) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
}

function formatDayLabel(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function renderPieShareLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: {
  cx?: number | string;
  cy?: number | string;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
}) {
  if (
    typeof cx !== "number" ||
    typeof cy !== "number" ||
    typeof midAngle !== "number" ||
    typeof innerRadius !== "number" ||
    typeof outerRadius !== "number" ||
    !percent ||
    percent < 0.08
  ) {
    return null;
  }

  const radius = innerRadius + (outerRadius - innerRadius) * 0.58;
  const angle = (-midAngle * Math.PI) / 180;
  const x = cx + radius * Math.cos(angle);
  const y = cy + radius * Math.sin(angle);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-[11px] font-semibold"
    >
      {Math.round(percent * 100)}%
    </text>
  );
}

interface StatusOverviewChartsProps {
  statusFilters: StatusFilterItem[];
  dailyTickets: DailyTicketItem[];
  totalCount: number;
}

const StatusOverviewCharts = memo(function StatusOverviewCharts({
  statusFilters,
  dailyTickets,
  totalCount,
}: StatusOverviewChartsProps) {
  const statusRows = statusFilters.map((item) => ({
    ...item,
    share: totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0,
    color: getStatusChartColor(item.name),
  }));
  const pieRows = statusRows.filter((item) => item.count > 0);
  const dailyRows = dailyTickets.map((item) => ({
    ...item,
    day: formatDayLabel(item.date),
  }));

  return (
    <div className="grid gap-5 px-4 py-4 xl:grid-cols-[minmax(0,1fr)_minmax(520px,620px)] xl:items-start">
      <div className="min-w-0">
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Daily Tickets Created
            </p>
            <p className="text-xs text-muted-foreground">{dailyRows.length} days</p>
          </div>
          <div className="h-44 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyRows} margin={{ top: 6, right: 8, left: -24, bottom: 0 }}>
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--border)" }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)" }}
                  contentStyle={{
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
                    fontSize: 12,
                  }}
                  labelFormatter={(label) => `Date: ${label}`}
                  formatter={(value) => [value, "Tickets"]}
                />
                <Bar dataKey="count" fill="var(--primary)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="min-w-0 border-t pt-4 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
        <p className="text-xs font-semibold uppercase text-muted-foreground">Status Distribution</p>

        <div className="mt-3 grid gap-5 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center">
          <div className="h-44 w-44 justify-self-center sm:justify-self-start">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieRows.length > 0 ? pieRows : [{ name: "No tickets", count: 1, share: 0 }]}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={82}
                  labelLine={false}
                  label={renderPieShareLabel}
                >
                  {(pieRows.length > 0
                    ? pieRows
                    : [{ name: "No tickets", color: "var(--muted)" }]
                  ).map((item) => (
                    <Cell key={item.name} fill={item.color} stroke="var(--card)" strokeWidth={1} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
                    fontSize: 12,
                  }}
                  formatter={(value, name) => [value, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="min-w-0">
            <div className="grid grid-cols-[minmax(0,1fr)_72px] gap-3 border-b pb-1 text-xs font-medium text-muted-foreground">
              <span>Status</span>
              <span className="text-right">Count</span>
            </div>
            <div className="divide-y">
              {statusRows.map((item) => (
                <div
                  key={item.id || item.name}
                  className="grid grid-cols-[minmax(0,1fr)_72px] items-center gap-3 py-2 text-sm"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate font-medium">{item.name}</span>
                  </span>
                  <span className="text-right tabular-nums text-muted-foreground">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export function StatusFilterSection({
  statusFilters,
  dailyTickets,
  totalCount,
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
}: StatusFilterSectionProps) {
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const selectedStatusIds = new Set(statusFilterIds);
  const selectedStatusNames = statuses
    .filter((status) => selectedStatusIds.has(status.id))
    .map((status) => status.name);
  const statusFilterLabel =
    selectedStatusNames.length === 0
      ? "All statuses"
      : selectedStatusNames.length === 1
        ? selectedStatusNames[0]
        : `${selectedStatusNames.length} statuses`;
  const selectedUser = users.find((user) => String(user.id) === userFilter);
  const userFilterLabel = userFilter === ALL_USERS ? "All users" : (selectedUser?.name ?? "User");

  useEffect(() => {
    const closeFilterMenus = (event: MouseEvent) => {
      if (!statusMenuRef.current?.contains(event.target as Node)) {
        setIsStatusMenuOpen(false);
      }

      if (!userMenuRef.current?.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", closeFilterMenus);
    return () => document.removeEventListener("mousedown", closeFilterMenus);
  }, []);

  const toggleStatus = (statusId: number) => {
    const nextSelectedStatusIds = new Set(statusFilterIds);

    if (nextSelectedStatusIds.has(statusId)) {
      nextSelectedStatusIds.delete(statusId);
    } else {
      nextSelectedStatusIds.add(statusId);
    }

    onStatusChange(
      statuses.filter((status) => nextSelectedStatusIds.has(status.id)).map((status) => status.id),
    );
  };

  const selectUser = (value: string) => {
    onUserChange(value);
    setIsUserMenuOpen(false);
  };

  return (
    <section className="rounded-md border bg-card shadow-sm">
      <StatusOverviewCharts
        statusFilters={statusFilters}
        dailyTickets={dailyTickets}
        totalCount={totalCount}
      />

      <div
        className={`grid gap-3 border-t bg-muted/25 px-4 py-3 ${
          showUserFilter
            ? "lg:grid-cols-[minmax(260px,1fr)_180px_180px_190px_220px]"
            : "lg:grid-cols-[minmax(260px,1fr)_180px_180px_190px]"
        }`}
      >
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Search</span>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Title, ID, requester, or body"
              className="h-10 bg-background pl-9"
            />
          </div>
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">From</span>
          <input
            type="date"
            value={startDate}
            onChange={(event) => onStartDateChange(event.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">To</span>
          <input
            type="date"
            value={endDate}
            onChange={(event) => onEndDateChange(event.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </label>

        <div ref={statusMenuRef} className="relative space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Status</span>
          <button
            type="button"
            aria-expanded={isStatusMenuOpen}
            onClick={() => setIsStatusMenuOpen((current) => !current)}
            className="flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-left text-sm outline-none transition-colors hover:bg-muted focus:ring-2 focus:ring-ring"
          >
            <span className="truncate">{statusFilterLabel}</span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                isStatusMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isStatusMenuOpen && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-md border bg-card p-1 shadow-xl">
              <button
                type="button"
                onClick={() => onStatusChange([])}
                className="flex w-full items-center justify-between gap-2 rounded px-2 py-2 text-left text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span>All statuses</span>
                {statusFilterIds.length === 0 && <Check className="h-4 w-4 text-primary" />}
              </button>

              <div className="my-1 border-t" />

              {statuses.map((status) => (
                <label
                  key={status.id}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-sm transition-colors hover:bg-muted"
                >
                  <input
                    type="checkbox"
                    checked={selectedStatusIds.has(status.id)}
                    onChange={() => toggleStatus(status.id)}
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                  <span className="truncate">{status.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {showUserFilter && (
          <div ref={userMenuRef} className="relative space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Assignee</span>
            <button
              type="button"
              aria-expanded={isUserMenuOpen}
              onClick={() => setIsUserMenuOpen((current) => !current)}
              className="flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-left text-sm outline-none transition-colors hover:bg-muted focus:ring-2 focus:ring-ring"
            >
              <span className="truncate">{userFilterLabel}</span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                  isUserMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isUserMenuOpen && (
              <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-md border bg-card p-1 shadow-xl">
                <button
                  type="button"
                  onClick={() => selectUser(ALL_USERS)}
                  className="flex w-full items-center justify-between gap-2 rounded px-2 py-2 text-left text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span>All users</span>
                  {userFilter === ALL_USERS && <Check className="h-4 w-4 text-primary" />}
                </button>

                <div className="my-1 border-t" />

                {users.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => selectUser(String(user.id))}
                    className="flex w-full items-center justify-between gap-2 rounded px-2 py-2 text-left text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="truncate">{user.name}</span>
                    {userFilter === String(user.id) && <Check className="h-4 w-4 text-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
