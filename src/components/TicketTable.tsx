import { Link } from "@tanstack/react-router";
import { StatusBadge } from "./StatusBadge";
import { PriorityBadge } from "./PriorityBadge";
import { OFFICERS, type Ticket } from "@/lib/mock-data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function officerName(id: string | null) {
  if (!id) return "—";
  return OFFICERS.find((o) => o.id === id)?.name ?? "—";
}

interface Props {
  tickets: Ticket[];
  basePath: "/admin/tickets" | "/officer/tickets";
  emptyMessage?: string;
}

function TicketLink({
  basePath,
  id,
  className,
  children,
}: {
  basePath: "/admin/tickets" | "/officer/tickets";
  id: string;
  className?: string;
  children: React.ReactNode;
}) {
  if (basePath === "/admin/tickets") {
    return (
      <Link to="/admin/tickets/$id" params={{ id }} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <Link to="/officer/tickets/$id" params={{ id }} className={className}>
      {children}
    </Link>
  );
}

export function TicketTable({ tickets, basePath, emptyMessage = "No tickets found." }: Props) {
  if (tickets.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed bg-card text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Requester</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((t) => (
              <TableRow key={t.id} className="cursor-pointer">
                <TableCell className="font-mono text-xs text-muted-foreground">
                  <TicketLink basePath={basePath} id={t.id} className="hover:underline">
                    {t.id}
                  </TicketLink>
                </TableCell>
                <TableCell className="font-medium">
                  <TicketLink basePath={basePath} id={t.id} className="hover:underline">
                    {t.title}
                  </TicketLink>
                </TableCell>
                <TableCell>{t.requester}</TableCell>
                <TableCell><PriorityBadge priority={t.priority} /></TableCell>
                <TableCell><StatusBadge status={t.status} /></TableCell>
                <TableCell className="text-sm">{officerName(t.assignedOfficerId)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(t.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="grid gap-3 md:hidden">
        {tickets.map((t) => (
          <TicketLink
            key={t.id}
            basePath={basePath}
            id={t.id}
            className="block rounded-xl border bg-card p-4 transition-colors hover:bg-accent/40"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-mono text-xs text-muted-foreground">{t.id}</p>
                <p className="mt-0.5 truncate font-medium">{t.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t.requester} · {formatDate(t.createdAt)}
                </p>
              </div>
              <StatusBadge status={t.status} />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <PriorityBadge priority={t.priority} />
              <span className="text-xs text-muted-foreground">{officerName(t.assignedOfficerId)}</span>
            </div>
          </TicketLink>
        ))}
      </div>
    </>
  );
}