function normalizeStatusName(status: string) {
  return status.toLowerCase().replace(/\s+/g, " ").trim();
}

export function getStatusBadgeClass(status: string) {
  const normalized = normalizeStatusName(status);

  if (normalized === "initiated") return "border-slate-300 bg-slate-50 text-slate-700";
  if (normalized === "in progress") return "border-blue-300 bg-blue-50 text-blue-700";
  if (normalized === "closed") return "border-emerald-300 bg-emerald-50 text-emerald-700";
  if (normalized === "cancelled" || normalized === "canceled") {
    return "border-rose-300 bg-rose-50 text-rose-700";
  }

  return "border-border bg-muted text-muted-foreground";
}

export function getStatusChartColor(status: string) {
  const normalized = normalizeStatusName(status);

  if (normalized === "initiated") return "#64748b";
  if (normalized === "in progress") return "#2563eb";
  if (normalized === "closed") return "#059669";
  if (normalized === "cancelled" || normalized === "canceled") return "#e11d48";

  return "#475569";
}
