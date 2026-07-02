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
  return (
    <section className="overflow-hidden rounded-lg border bg-card/95 shadow-[0_16px_45px_rgba(15,15,15,0.05)]">
      <div className="overflow-x-auto">
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
            <TableRow className="bg-secondary/60">
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
                  className="cursor-pointer align-top transition-colors hover:bg-secondary/45"
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

      {isAdmin && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-background/60 px-4 py-3 text-sm">
          <span className="text-muted-foreground">
            Page {page} of {pageCount}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onPageChange((current) => Math.max(1, current - 1))}
              disabled={page <= 1 || isLoading}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onPageChange((current) => Math.min(pageCount, current + 1))}
              disabled={page >= pageCount || isLoading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
