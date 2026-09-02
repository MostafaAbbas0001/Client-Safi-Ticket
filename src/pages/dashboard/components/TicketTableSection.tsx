import type { Ticket, User } from "../dashboard-data";
import { getBodyPreview } from "../dashboard-utils";
import { StatusBadge } from "./TicketBadges";

interface TicketTableSectionProps {
  tickets: Ticket[];
  isAdmin: boolean;
  isLoading: boolean;
  currentUser: User;
  page: number;
  pageCount: number;
  onPageChange: (updater: (page: number) => number) => void;
  onSelectTicket: (ticket: Ticket) => void;
}

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

export function TicketTableSection({
  tickets,
  isAdmin,
  isLoading,
  currentUser,
  page,
  pageCount,
  onPageChange,
  onSelectTicket,
}: TicketTableSectionProps) {
  return (
    <section className="mt-4 overflow-hidden rounded-[9px] border border-[#dde4ec] bg-white shadow-[0_2px_8px_rgba(15,35,66,0.04)]">
      <div className="divide-y divide-[#e3e8ee] md:hidden">
        {isLoading && tickets.length === 0 ? (
          <div className="px-4 py-10 text-center text-[12px] text-[#63748a]">
            Loading tickets...
          </div>
        ) : tickets.length === 0 ? (
          <div className="px-4 py-10 text-center text-[12px] text-[#63748a]">
            No tickets match these filters.
          </div>
        ) : (
          tickets.map((ticket) => (
            <button
              key={ticket.id}
              type="button"
              onClick={() => onSelectTicket(ticket)}
              className="w-full px-4 py-4 text-left transition-colors hover:bg-[#f8faff]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold tracking-[0.04em] text-[#146ef5]">
                    TK-{ticket.id}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[13px] font-semibold leading-5 text-[#102445]">
                    {ticket.title}
                  </p>
                </div>
                <StatusBadge status={ticket.status} />
              </div>

              <p className="mt-2 line-clamp-2 text-[11px] leading-[17px] text-[#63748a]">
                {getBodyPreview(ticket.body)}
              </p>

              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-[#edf0f4] pt-3">
                <div className="min-w-0">
                  <span className="block text-[9px] font-semibold uppercase tracking-[0.05em] text-[#8190a2]">
                    Requester
                  </span>
                  <span className="mt-1 block truncate text-[11px] font-medium text-[#263b59]">
                    {ticket.requester}
                  </span>
                </div>
                <div className="min-w-0 text-right">
                  <span className="block text-[9px] font-semibold uppercase tracking-[0.05em] text-[#8190a2]">
                    Assignee
                  </span>
                  <span className="mt-1 block truncate text-[11px] font-medium text-[#263b59]">
                    {ticket.assignee || (!isAdmin ? currentUser.name : "Unassigned")}
                  </span>
                </div>
                <time className="col-span-2 text-[10px] text-[#63748a]">
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
            <col className="w-[23%]" />
            <col className="w-[14%]" />
            <col className="w-[11%]" />
            <col className="w-[13%]" />
            <col className="w-[15%]" />
          </colgroup>
          <thead className="bg-[#f7f9fc]">
            <tr className="border-b border-[#e1e7ee] text-[10px] font-semibold text-[#50637b]">
              {["ID", "Title", "Body preview", "Requester", "Status", "Assignee", "Created"].map(
                (label) => (
                  <th key={label} className={`h-9 px-3 ${label === "Status" ? "text-center" : ""}`}>
                    {label}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e3e8ee]">
            {isLoading && tickets.length === 0 ? (
              <tr>
                <td colSpan={7} className="h-28 text-center text-xs text-[#63748a]">
                  Loading tickets...
                </td>
              </tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan={7} className="h-28 text-center text-xs text-[#63748a]">
                  No tickets match these filters.
                </td>
              </tr>
            ) : (
              tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  onClick={() => onSelectTicket(ticket)}
                  className="h-[48px] cursor-pointer text-[11px] text-[#0f2342] transition-colors hover:bg-[#f8faff]"
                >
                  <td className="whitespace-nowrap px-3 font-medium text-[#146ef5]">
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pageCount > 1 && (
        <div className="flex items-center justify-between border-t border-[#e3e8ee] px-4 py-2 text-[11px] text-[#63748a]">
          <span>
            Page {page} of {pageCount}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onPageChange((current) => Math.max(1, current - 1))}
              disabled={page <= 1}
              className="rounded border px-3 py-1.5 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => onPageChange((current) => Math.min(pageCount, current + 1))}
              disabled={page >= pageCount}
              className="rounded border px-3 py-1.5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
