import { useEffect, useState } from "react";
import type { LookupItem, Ticket, UserLookupItem } from "./dashboard-data";

export const ALL_PRIORITIES = "all-priorities";
export const ALL_USERS = "all-users";
export const PAGE_SIZE = 50;
export const STAFF_EDITABLE_STATUSES = ["Initiated", "In Progress", "Closed", "Cancelled"];

function normalizeStatusName(status: string) {
  return status.toLowerCase().replace(/\s+/g, " ").trim();
}

export function getStatusBadgeClass(status: string) {
  const normalized = normalizeStatusName(status);

  if (normalized === "initiated") return "border-slate-200 bg-slate-50 text-slate-700";
  if (normalized === "in progress") return "border-sky-200 bg-sky-50 text-sky-700";
  if (normalized === "closed") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (normalized === "cancelled" || normalized === "canceled") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-border bg-muted text-muted-foreground";
}

export function getStatusAccentClass(status: string) {
  const normalized = normalizeStatusName(status);

  if (normalized === "initiated") return "border-t-slate-500 [&_.status-progress]:bg-slate-500";
  if (normalized === "in progress") return "border-t-sky-500 [&_.status-progress]:bg-sky-500";
  if (normalized === "closed") return "border-t-emerald-500 [&_.status-progress]:bg-emerald-500";
  if (normalized === "cancelled" || normalized === "canceled") {
    return "border-t-red-500 [&_.status-progress]:bg-red-500";
  }

  return "border-t-primary [&_.status-progress]:bg-primary";
}

export function getPriorityBadgeClass(priority: string) {
  const normalized = priority.toLowerCase();

  if (normalized === "critical") return "border-red-200 bg-red-50 text-red-700";
  if (normalized === "high") return "border-orange-200 bg-orange-50 text-orange-700";
  if (normalized === "medium") return "border-amber-200 bg-amber-50 text-amber-700";
  if (normalized === "low") return "border-emerald-200 bg-emerald-50 text-emerald-700";

  return "border-slate-200 bg-slate-50 text-slate-600";
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
  return value.length > 72 ? `${value.slice(0, 72)}...` : value;
}

function getLookupName(items: LookupItem[] | undefined, id: number | null | undefined) {
  if (!id) return undefined;
  return items?.find((item) => item.id === id)?.name;
}

export function mapTicketLookups(
  ticket: Ticket,
  statuses: LookupItem[] | undefined,
  priorities: LookupItem[] | undefined,
  users: UserLookupItem[] | undefined,
) {
  return {
    ...ticket,
    status: getLookupName(statuses, ticket.statusId) ?? ticket.status,
    priority: getLookupName(priorities, ticket.priorityId) ?? ticket.priority,
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
