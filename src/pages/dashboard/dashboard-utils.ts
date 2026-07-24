import { useEffect, useState } from "react";
import type { LookupItem, Ticket, UserLookupItem } from "./dashboard-data";

export const ALL_USERS = "all-users";
export const PAGE_SIZE = 50;

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

export function getStatusAccentClass(status: string) {
  const normalized = normalizeStatusName(status);

  if (normalized === "initiated") return "border-t-slate-500 [&_.status-progress]:bg-slate-500";
  if (normalized === "in progress") return "border-t-blue-600 [&_.status-progress]:bg-blue-600";
  if (normalized === "closed") return "border-t-emerald-600 [&_.status-progress]:bg-emerald-600";
  if (normalized === "cancelled" || normalized === "canceled") {
    return "border-t-rose-600 [&_.status-progress]:bg-rose-600";
  }

  return "border-t-primary [&_.status-progress]:bg-primary";
}

export function getStatusChartColor(status: string) {
  const normalized = normalizeStatusName(status);

  if (normalized === "initiated") return "#64748b";
  if (normalized === "in progress") return "#2563eb";
  if (normalized === "closed") return "#059669";
  if (normalized === "cancelled" || normalized === "canceled") return "#e11d48";

  return "#475569";
}

export function formatDate(value?: string) {
  if (!value) return "N/A";

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}

export function formatAttachmentSize(sizeBytes: number) {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  return `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`;
}

export function getBodyPreview(value?: string) {
  if (!value?.trim()) return "-";

  const preview = value
    .replace(/<\s*(script|style)\b[\s\S]*?<\s*\/\s*\1\s*>/gi, " ")
    .replace(/<\s*\/?\s*(br|p|div|tr|li|table|thead|tbody|tfoot)\b[^>]*>/gi, " ")
    .replace(/<\s*\/?\s*(td|th)\b[^>]*>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();

  if (!preview) return "-";
  return preview.length > 72 ? `${preview.slice(0, 72)}...` : preview;
}

function getLookupName(items: LookupItem[] | undefined, id: number | null | undefined) {
  if (!id) return undefined;
  return items?.find((item) => item.id === id)?.name;
}

export function mapTicketLookups(
  ticket: Ticket,
  statuses: LookupItem[] | undefined,
  users: UserLookupItem[] | undefined,
) {
  return {
    ...ticket,
    status: getLookupName(statuses, ticket.statusId) ?? ticket.status,
    assignee: users?.find((user) => user.id === ticket.userId)?.name ?? ticket.assignee,
  };
}

export function useDebouncedValue(value: string, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);

  return debounced;
}

export function getMutationError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
