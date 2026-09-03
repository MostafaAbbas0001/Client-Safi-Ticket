import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { ProgressBar } from "@/components/progress-bar";
import { Skeleton } from "@/components/skeleton";
import type { TicketTableSectionProps } from "@/models";
import { getBodyPreview } from "../dashboard-utils";
import { StatusBadge } from "@/components/status-badge";
import { UnreadReplyBadge } from "@/components/unread-reply-badge";

const SKELETON_ROWS = 8;
const COLUMNS: { key: string; label: string; center?: boolean; srOnlyLabel?: boolean }[] = [
  { key: "id", label: "ID" },
  { key: "title", label: "Title" },
  { key: "body", label: "Body preview" },
  { key: "requester", label: "Requester" },
  { key: "status", label: "Status", center: true },
  { key: "assignee", label: "Assignee" },
  { key: "created", label: "Created" },
  { key: "reply", label: "Unread replies", center: true, srOnlyLabel: true },
];

function ticketDate(value?: string) {
  if (!value) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}

/** Mirrors the real row layout so the table does not jump when data lands. */
function SkeletonRow() {
  return (
    <tr className="h-[48px]">
      <td className="px-3">
        <Skeleton className="h-3 w-12" />
      </td>
      <td className="px-3">
        <Skeleton className="h-3 w-[85%]" />
      </td>
      <td className="px-3">
        <Skeleton className="h-3 w-[92%]" />
      </td>
      <td className="px-3">
        <Skeleton className="h-3 w-[70%]" />
      </td>
      <td className="px-2">
        <Skeleton className="mx-auto h-5 w-[84px] rounded-[5px]" />
      </td>
      <td className="px-3">
        <Skeleton className="h-3 w-[72%]" />
      </td>
      <td className="px-3">
        <Skeleton className="h-3 w-[88%]" />
      </td>
      <td className="px-3 text-center">
        <Skeleton className="mx-auto h-4 w-4 rounded-full" />
      </td>
    </tr>
  );
}

function SkeletonCard() {
  return (
    <div className="px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-2.5 w-14" />
          <Skeleton className="h-3.5 w-[80%]" />
        </div>
        <Skeleton className="h-6 w-[84px] rounded-[5px]" />
      </div>
      <Skeleton className="mt-3 h-2.5 w-full" />
      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-line-soft pt-3">
        <Skeleton className="h-2.5 w-20" />
        <Skeleton className="h-2.5 w-20 justify-self-end" />
      </div>
    </div>
  );
}

export function TicketTableSection({
  tickets,
  isAdmin,
  isLoading,
  isRefreshing,
  currentUser,
  page,
  pageCount,
  pageSize,
  totalCount,
  onPageChange,
  onSelectTicket,
}: TicketTableSectionProps) {
  const isEmpty = !isLoading && tickets.length === 0;
  const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalCount);

  return (
    <section className="mt-4 overflow-hidden rounded-card border border-line bg-surface shadow-card">
      <header className="flex items-center justify-between gap-3 border-b border-line-soft px-4 py-3">
        <div className="flex items-baseline gap-2">
          <h2 className="text-[13px] font-semibold text-ink">Tickets</h2>
          {isLoading ? (
            <Skeleton className="h-3 w-16" />
          ) : (
            <span className="text-[11px] text-ink-muted">
              {totalCount.toLocaleString()} {totalCount === 1 ? "result" : "results"}
            </span>
          )}
        </div>
        {isRefreshing && (
          <span
            aria-live="polite"
            className="text-[10px] font-medium uppercase tracking-[0.06em] text-brand"
          >
            Updating
          </span>
        )}
      </header>
      <ProgressBar active={isLoading || isRefreshing} label="Loading tickets" />

      <div
        className={`divide-y divide-line-soft md:hidden ${isRefreshing ? "is-refreshing" : ""}`}
        aria-busy={isLoading || isRefreshing}
      >
        {isLoading ? (
          <>
            <span className="sr-only">Loading tickets</span>
            {Array.from({ length: 4 }, (_, index) => (
              <SkeletonCard key={index} />
            ))}
          </>
        ) : isEmpty ? (
          <EmptyState
            icon={<Inbox />}
            title="No tickets match these filters"
            description="Try widening the date range, clearing the status filter, or searching for a different term."
          />
        ) : (
          tickets.map((ticket) => (
            <button
              key={ticket.id}
              type="button"
              onClick={() => onSelectTicket(ticket)}
              className={`w-full border-l-[3px] px-4 py-4 text-left transition-colors hover:bg-surface-hover ${
                ticket.hasUnreadRequesterReply
                  ? "border-l-brand bg-brand-soft/40"
                  : "border-l-transparent"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold tracking-[0.04em] text-brand">
                    TK-{ticket.id}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[13px] font-semibold leading-5 text-ink">
                    {ticket.title}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <StatusBadge status={ticket.status} />
                  {ticket.hasUnreadRequesterReply && (
                    <UnreadReplyBadge count={ticket.unreadRequesterReplyCount ?? 1} />
                  )}
                </div>
              </div>

              <p className="mt-2 line-clamp-2 text-[11px] leading-[17px] text-ink-muted">
                {getBodyPreview(ticket.body)}
              </p>

              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-[#edf0f4] pt-3">
                <div className="min-w-0">
                  <span className="block text-[9px] font-semibold uppercase tracking-[0.05em] text-ink-subtle">
                    Requester
                  </span>
                  <span className="mt-1 block truncate text-[11px] font-medium text-[#263b59]">
                    {ticket.requester}
                  </span>
                </div>
                <div className="min-w-0 text-right">
                  <span className="block text-[9px] font-semibold uppercase tracking-[0.05em] text-ink-subtle">
                    Assignee
                  </span>
                  <span className="mt-1 block truncate text-[11px] font-medium text-[#263b59]">
                    {ticket.assignee || (!isAdmin ? currentUser.name : "Unassigned")}
                  </span>
                </div>
                <time className="col-span-2 text-[10px] text-ink-muted">
                  {ticketDate(ticket.createdAt)}
                </time>
              </div>
            </button>
          ))
        )}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[1010px] table-fixed border-collapse text-left">
          <colgroup>
            <col className="w-[7%]" />
            <col className="w-[17%]" />
            <col className="w-[17%]" />
            <col className="w-[14%]" />
            <col className="w-[11%]" />
            <col className="w-[13%]" />
            <col className="w-[15%]" />
            <col className="w-[6%]" />
          </colgroup>
          <thead className="bg-surface-muted">
            <tr className="border-b border-[#e1e7ee] text-[10px] font-semibold uppercase tracking-[0.04em] text-[#50637b]">
              {COLUMNS.map((column) => (
                <th key={column.key} className={`h-9 px-3 ${column.center ? "text-center" : ""}`}>
                  <span className={column.srOnlyLabel ? "sr-only" : undefined}>{column.label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody
            className={`divide-y divide-line-soft ${isRefreshing ? "is-refreshing" : ""}`}
            aria-busy={isLoading || isRefreshing}
          >
            {isLoading ? (
              Array.from({ length: SKELETON_ROWS }, (_, index) => <SkeletonRow key={index} />)
            ) : isEmpty ? (
              <tr>
                <td colSpan={COLUMNS.length}>
                  <EmptyState
                    icon={<Inbox />}
                    title="No tickets match these filters"
                    description="Try widening the date range, clearing the status filter, or searching for a different term."
                  />
                </td>
              </tr>
            ) : (
              tickets.map((ticket) => {
                const isUnread = ticket.hasUnreadRequesterReply;

                return (
                  <tr
                    key={ticket.id}
                    onClick={() => onSelectTicket(ticket)}
                    className={`h-[48px] cursor-pointer text-[11px] text-ink transition-colors hover:bg-surface-hover ${
                      isUnread ? "bg-brand-soft/50" : ""
                    }`}
                  >
                    <td
                      className={`whitespace-nowrap border-l-[3px] py-0 pl-[9px] pr-3 font-semibold text-brand ${
                        isUnread ? "border-l-brand" : "border-l-transparent"
                      }`}
                    >
                      TK-{ticket.id}
                    </td>
                    <td className="px-3 font-semibold">
                      <span className="line-clamp-2 leading-[16px]">{ticket.title}</span>
                    </td>
                    <td className="px-3 text-[#5f7188]">
                      <span className="line-clamp-2 leading-[16px]">
                        {getBodyPreview(ticket.body)}
                      </span>
                    </td>
                    <td className="px-3">
                      <span className="line-clamp-2 leading-[16px]">{ticket.requester}</span>
                    </td>
                    <td className="px-2 text-center">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-3">
                      <span className="line-clamp-2 leading-[16px]">
                        {ticket.assignee || (!isAdmin ? currentUser.name : "Unassigned")}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 text-[#566a83]">
                      {ticketDate(ticket.createdAt)}
                    </td>
                    <td className="px-3 text-center">
                      {isUnread && (
                        <UnreadReplyBadge count={ticket.unreadRequesterReplyCount ?? 1} />
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between gap-3 border-t border-line-soft bg-surface-muted px-4 py-2.5 text-[11px] text-ink-muted">
          <span className="tabular-nums">
            {isLoading ? (
              <Skeleton className="h-3 w-32" />
            ) : (
              <>
                Showing <strong className="font-semibold text-ink">{rangeStart}</strong>-
                <strong className="font-semibold text-ink">{rangeEnd}</strong> of{" "}
                <strong className="font-semibold text-ink">{totalCount.toLocaleString()}</strong>
              </>
            )}
          </span>
          <div className="flex items-center gap-2">
            <span className="hidden tabular-nums sm:inline">
              Page {page} of {pageCount}
            </span>
            <button
              type="button"
              onClick={() => onPageChange((current) => Math.max(1, current - 1))}
              disabled={page <= 1 || isRefreshing}
              className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-field border border-line bg-surface px-2.5 font-medium text-[#304760] transition-colors hover:border-[#c5d1dd] hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-surface"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </button>
            <button
              type="button"
              onClick={() => onPageChange((current) => Math.min(pageCount, current + 1))}
              disabled={page >= pageCount || isRefreshing}
              className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-field border border-line bg-surface px-2.5 font-medium text-[#304760] transition-colors hover:border-[#c5d1dd] hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-surface"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
