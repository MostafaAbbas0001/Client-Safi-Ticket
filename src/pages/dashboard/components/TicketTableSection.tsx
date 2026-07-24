import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Ticket, User } from "../dashboard-data";
import { formatDate, getBodyPreview } from "../dashboard-utils";
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
  const renderPagination = () =>
    isAdmin && (
      <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-background px-4 py-3 text-sm">
        <span className="text-muted-foreground">
          Page {page} of {pageCount}
        </span>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => onPageChange((current) => Math.max(1, current - 1))}
            disabled={page <= 1 || isLoading}
            className="w-full sm:w-auto"
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onPageChange((current) => Math.min(pageCount, current + 1))}
            disabled={page >= pageCount || isLoading}
            className="w-full sm:w-auto"
          >
            Next
          </Button>
        </div>
      </div>
    );

  return (
    <section className="overflow-hidden rounded-md border bg-card shadow-sm">
      <div className="divide-y md:hidden">
        {isLoading ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            Loading tickets...
          </div>
        ) : tickets.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            No tickets match these filters.
          </div>
        ) : (
          tickets.map((ticket) => (
            <button
              key={ticket.id}
              type="button"
              onClick={() => onSelectTicket(ticket)}
              className="w-full px-4 py-3 text-left transition-colors hover:bg-muted/50"
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-muted-foreground">TK-{ticket.id}</p>
                  <p className="mt-1 line-clamp-2 text-sm font-semibold">{ticket.title}</p>
                </div>
                <StatusBadge status={ticket.status} />
              </div>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {getBodyPreview(ticket.body)}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                <div>
                  <span className="block font-medium text-foreground">{ticket.requester}</span>
                  Requester
                </div>
                <div className="text-right">
                  Assignee
                  <span className="block font-medium text-foreground">
                    {ticket.assignee || (!isAdmin ? currentUser.name : "Unassigned")}
                  </span>
                </div>
                <div className="col-span-2 border-t pt-2">{formatDate(ticket.createdAt)}</div>
              </div>
            </button>
          ))
        )}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <Table className="w-full min-w-[1280px] table-fixed">
          <colgroup>
            <col className="w-24" />
            <col className="w-56" />
            <col className="w-80" />
            <col className="w-40" />
            <col className="w-36" />
            <col className="w-40" />
            <col className="w-32" />
            <col className="w-28" />
          </colgroup>
          <TableHeader>
            <TableRow className="bg-muted/60">
              <TableHead>ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Body preview</TableHead>
              <TableHead>Requester</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead className="text-center">Created</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-28 text-center text-muted-foreground">
                  Loading tickets...
                </TableCell>
              </TableRow>
            ) : tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-28 text-center text-muted-foreground">
                  No tickets match these filters.
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((ticket) => (
                <TableRow
                  key={ticket.id}
                  className="cursor-pointer align-top transition-colors hover:bg-muted/50"
                  onClick={() => onSelectTicket(ticket)}
                >
                  <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                    TK-{ticket.id}
                  </TableCell>
                  <TableCell className="font-medium">
                    <span className="line-clamp-2 break-words">{ticket.title}</span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <span className="line-clamp-2 break-words">{getBodyPreview(ticket.body)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="line-clamp-2 break-words">{ticket.requester}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <StatusBadge status={ticket.status} />
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="line-clamp-2 break-words">
                      {ticket.assignee || (!isAdmin ? currentUser.name : "Unassigned")}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-center text-sm text-muted-foreground">
                    {formatDate(ticket.createdAt)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectTicket(ticket);
                      }}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {renderPagination()}
    </section>
  );
}
