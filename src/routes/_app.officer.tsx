import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, CircleDot, Clock3, Mail, MessageSquare, Paperclip, Search, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  addTicketComment,
  getAssignedTickets,
  getAttachmentUrl,
  getTicketAttachments,
  getTicketComments,
  replyToTicket,
  userUpdateTicket,
  type Ticket,
  type TicketAttachment,
  type TicketComment,
} from "@/api/ticketApi";
import { API_BASE_URL } from "@/api/http";
import { getPriorities, getStatuses, type LookupItem } from "@/api/lookupApi";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_app/officer")({
  head: () => ({ meta: [{ title: "Staff Dashboard - Helpdesk" }] }),
  component: OfficerPage,
});

const ALL_FILTER = "All";
const ALL_PRIORITY_FILTER = "all-priorities";
const STATUS_ORDER = [
  "All",
  "New",
  "Pending",
  "In Progress",
  "Resolved",
  "Closed",
  "Canceled",
  "Cancelled",
];
const STAFF_EDITABLE_STATUSES = ["Pending", "In Progress", "Resolved"];

function formatAttachmentSize(sizeBytes: number) {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  return `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

function getBodyPreview(value?: string) {
  if (!value?.trim()) return "-";
  return value.length > 72 ? `${value.slice(0, 72)}...` : value;
}

function normalizeStatusName(status: string) {
  return status.toLowerCase().replace(/\s+/g, " ").trim();
}

function getStatusIcon(status: string): LucideIcon {
  const normalized = normalizeStatusName(status);

  if (normalized === "resolved") return CheckCircle2;
  if (normalized === "closed") return CheckCircle2;
  if (normalized === "in progress") return Clock3;
  if (normalized === "canceled" || normalized === "cancelled") return XCircle;

  return CircleDot;
}

function getStatusHelper(status: string) {
  const normalized = normalizeStatusName(status);

  if (status === ALL_FILTER) return "All tickets";
  if (normalized === "new") return "Not started";
  if (normalized === "pending") return "Awaiting action";
  if (normalized === "in progress") return "Being handled";
  if (normalized === "resolved") return "Ready to close";
  if (normalized === "closed") return "Completed";
  if (normalized === "canceled" || normalized === "cancelled") return "Stopped";

  return "Filtered view";
}

function getStatusSortValue(status: string) {
  const index = STATUS_ORDER.findIndex(
    (knownStatus) => normalizeStatusName(knownStatus) === normalizeStatusName(status),
  );

  return index === -1 ? STATUS_ORDER.length : index;
}

function getStatusBadgeClass(status: string) {
  const normalized = normalizeStatusName(status);

  if (normalized === "new") return "border-indigo-200 bg-indigo-50 text-indigo-700";
  if (normalized === "pending") return "border-amber-200 bg-amber-50 text-amber-700";
  if (normalized === "in progress") return "border-sky-200 bg-sky-50 text-sky-700";
  if (normalized === "resolved") return "border-teal-200 bg-teal-50 text-teal-700";
  if (normalized === "closed") return "border-slate-300 bg-slate-100 text-slate-700";
  if (normalized === "canceled" || normalized === "cancelled") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-border bg-muted text-muted-foreground";
}

function getStatusFilterClass(status: string, isSelected: boolean) {
  const normalized = normalizeStatusName(status);

  if (isSelected) {
    if (normalized === "new") return "border-indigo-300 bg-indigo-50 text-indigo-800";
    if (normalized === "pending") return "border-amber-300 bg-amber-50 text-amber-800";
    if (normalized === "in progress") return "border-sky-300 bg-sky-50 text-sky-800";
    if (normalized === "resolved") return "border-teal-300 bg-teal-50 text-teal-800";
    if (normalized === "closed") return "border-slate-300 bg-slate-100 text-slate-800";
    if (normalized === "canceled" || normalized === "cancelled") {
      return "border-rose-300 bg-rose-50 text-rose-800";
    }

    return "border-primary/30 bg-primary/5 text-foreground";
  }

  return "border-border bg-background text-muted-foreground hover:border-foreground/20 hover:bg-muted/50 hover:text-foreground";
}

function getStatusDotClass(status: string) {
  const normalized = normalizeStatusName(status);

  if (normalized === "new") return "bg-indigo-500";
  if (normalized === "pending") return "bg-amber-500";
  if (normalized === "in progress") return "bg-sky-500";
  if (normalized === "resolved") return "bg-teal-500";
  if (normalized === "closed") return "bg-slate-500";
  if (normalized === "canceled" || normalized === "cancelled") return "bg-rose-500";

  return "bg-primary";
}

function getPriorityBadgeClass(priority: string) {
  const normalized = priority.toLowerCase();

  if (normalized === "critical") return "border-red-200 bg-red-50 text-red-700";
  if (normalized === "high") return "border-orange-200 bg-orange-50 text-orange-700";
  if (normalized === "medium") return "border-amber-200 bg-amber-50 text-amber-700";
  if (normalized === "low") return "border-emerald-200 bg-emerald-50 text-emerald-700";

  return "border-slate-200 bg-slate-50 text-slate-600";
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-xs font-semibold leading-none ${getStatusBadgeClass(status)}`}
    >
      {status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-xs font-semibold leading-none ${getPriorityBadgeClass(priority)}`}
    >
      {priority}
    </span>
  );
}

function OfficerPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [statuses, setStatuses] = useState<LookupItem[]>([]);
  const [priorities, setPriorities] = useState<LookupItem[]>([]);
  const [status, setStatus] = useState(ALL_FILTER);
  const [priority, setPriority] = useState(ALL_PRIORITY_FILTER);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [draftStatusId, setDraftStatusId] = useState("");
  const [draftPriorityId, setDraftPriorityId] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [addingSystemMessage, setAddingSystemMessage] = useState(false);
  const selectedTicketRef = useRef<Ticket | null>(null);

  const loadAssignedTickets = useCallback(
    async (showLoading = true) => {
      if (!user) return;

      try {
        if (showLoading) setLoading(true);
        setError(null);

        const [assignedTickets, statusData, priorityData] = await Promise.all([
          getAssignedTickets(user.id),
          getStatuses(),
          getPriorities(),
        ]);

        setStatuses(statusData);
        setPriorities(priorityData);
        setTickets(
          assignedTickets.map((ticket) => ({
            ...ticket,
            status:
              statusData.find((item) => item.id === ticket.statusId)?.name ??
              ticket.status,
            priority:
              priorityData.find((item) => item.id === ticket.priorityId)?.name ??
              ticket.priority,
          })),
        );
      } catch (err) {
        console.error("Failed to load assigned tickets:", err);
        setError(err instanceof Error ? err.message : "Failed to load assigned tickets.");
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [user],
  );

  useEffect(() => {
    void loadAssignedTickets();
  }, [loadAssignedTickets]);

  useEffect(() => {
    if (
      priority !== ALL_PRIORITY_FILTER &&
      !priorities.some((item) => String(item.id) === priority)
    ) {
      setPriority(ALL_PRIORITY_FILTER);
    }
  }, [priorities, priority]);

  useEffect(() => {
    selectedTicketRef.current = selectedTicket;
  }, [selectedTicket]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const eventSource = new EventSource(`${API_BASE_URL}/Notifications/stream`);

    eventSource.addEventListener("ticket-created", () => {
      void loadAssignedTickets(false);
    });

    eventSource.addEventListener("ticket-needs-admin-review", () => {
      void loadAssignedTickets(false);
    });

    eventSource.addEventListener("ticket-status-changed", () => {
      void loadAssignedTickets(false);
    });

    eventSource.addEventListener("ticket-comment-added", (event) => {
      const data = JSON.parse(event.data) as {
        ticketId: number;
      };
      const openTicket = selectedTicketRef.current;

      void loadAssignedTickets(false);

      if (openTicket?.id === data.ticketId) {
        void getTicketComments(data.ticketId)
          .then(setComments)
          .catch((err) => {
            console.error("Failed to load live ticket comments:", err);
          });
      }
    });

    eventSource.onerror = () => {
      console.warn("Live ticket notification stream disconnected. Browser will retry.");
    };

    return () => eventSource.close();
  }, [loadAssignedTickets, user]);

  async function openTicket(ticket: Ticket) {
    setSelectedTicket(ticket);
    setDraftStatusId(ticket.statusId ? String(ticket.statusId) : "");
    setDraftPriorityId(ticket.priorityId ? String(ticket.priorityId) : "");
    setReplyBody("");
    setComments([]);
    setAttachments([]);

    try {
      const [ticketComments, ticketAttachments] = await Promise.all([
        getTicketComments(ticket.id),
        getTicketAttachments(ticket.id),
      ]);
      setComments(ticketComments);
      setAttachments(ticketAttachments);
    } catch (err) {
      console.error("Failed to load ticket details:", err);
      setComments([]);
      setAttachments([]);
    }
  }

  async function handleSaveChanges() {
    if (!user || !selectedTicket) return;

    try {
      setSavingDetails(true);
      await userUpdateTicket(selectedTicket.id, {
        userId: user.id,
        statusId: draftStatusId ? Number(draftStatusId) : undefined,
        priorityId: draftPriorityId ? Number(draftPriorityId) : undefined,
      });
      await loadAssignedTickets(false);
      setSelectedTicket(null);
    } catch (err) {
      console.error("Failed to update assigned ticket:", err);
      alert("Failed to update ticket status or priority.");
    } finally {
      setSavingDetails(false);
    }
  }

  async function handleSendReply() {
    if (!user || !selectedTicket || !replyBody.trim()) return;

    try {
      setSendingReply(true);
      const reply = await replyToTicket(selectedTicket.id, {
        userId: user.id,
        body: replyBody.trim(),
        authorName: user.name,
        authorEmail: user.email,
      });

      setComments((current) => [...current, reply]);
      setReplyBody("");
    } catch (err) {
      console.error("Failed to send requester reply:", err);
      alert("Failed to send reply email. Please check SMTP settings and try again.");
    } finally {
      setSendingReply(false);
    }
  }

  async function handleAddSystemMessage() {
    if (!user || !selectedTicket || !replyBody.trim()) return;

    try {
      setAddingSystemMessage(true);
      const comment = await addTicketComment(selectedTicket.id, {
        userId: user.id,
        body: replyBody.trim(),
        authorName: user.name,
        authorEmail: user.email,
        authorType: "Agent",
        isInternalNote: false,
      });

      setComments((current) => [...current, comment]);
      setReplyBody("");
    } catch (err) {
      console.error("Failed to add system conversation message:", err);
      alert("Failed to add the message to the system conversation.");
    } finally {
      setAddingSystemMessage(false);
    }
  }

  const filtered = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase();

    return tickets.filter((ticket) => {
      if (status !== ALL_FILTER && ticket.status !== status) return false;
      if (priority !== ALL_PRIORITY_FILTER && String(ticket.priorityId ?? "") !== priority) {
        return false;
      }
      if (!trimmedQuery) return true;

      return (
        ticket.title.toLowerCase().includes(trimmedQuery) ||
        String(ticket.id).includes(trimmedQuery) ||
        ticket.requester.toLowerCase().includes(trimmedQuery) ||
        ticket.body?.toLowerCase().includes(trimmedQuery)
      );
    });
  }, [tickets, status, priority, query]);

  const editableStatuses = useMemo(
    () => statuses.filter((item) => STAFF_EDITABLE_STATUSES.includes(item.name)),
    [statuses],
  );

  const statusFilters = useMemo(() => {
    const allFilter = {
      id: 0,
      name: ALL_FILTER,
      count: tickets.length,
    };

    const statusFiltersFromData = statuses
      .map((item) => ({
        ...item,
        count: tickets.filter((ticket) => ticket.statusId === item.id).length,
      }))
      .sort((a, b) => getStatusSortValue(a.name) - getStatusSortValue(b.name));

    return [allFilter, ...statusFiltersFromData];
  }, [statuses, tickets]);

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <p>{error}</p>
          <Button variant="outline" className="mt-3" onClick={() => loadAssignedTickets()}>
            Retry
          </Button>
        </div>
      )}

      <div className="space-y-4">
        <div className="rounded-xl border bg-card p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">Ticket status</p>
            <p className="text-xs text-muted-foreground">
              {filtered.length} of {tickets.length} shown
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {statusFilters.map((item) => {
              const Icon = getStatusIcon(item.name);
              const isSelected = status === item.name;

              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setStatus(item.name)}
                  className={`flex min-h-16 min-w-40 select-none items-center gap-3 rounded-lg border px-3 py-2 text-left transition ${getStatusFilterClass(item.name, isSelected)}`}
                >
                  <span className={`h-2 w-2 rounded-full ${getStatusDotClass(item.name)}`} />
                  <span className="rounded-md text-current/80">
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">{item.name}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          isSelected ? "bg-white/70 text-current" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {item.count}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-current/65">
                      {getStatusHelper(item.name)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title, ID, requester, or body..."
              className="pl-9"
            />
          </div>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_PRIORITY_FILTER}>All priorities</SelectItem>
              {priorities.map((item) => (
                <SelectItem key={item.id} value={String(item.id)}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table className="min-w-[1120px] table-fixed">
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-24">ID</TableHead>
                <TableHead className="w-48">Title</TableHead>
                <TableHead className="w-[300px]">Body preview</TableHead>
                <TableHead className="w-40">Requester</TableHead>
                <TableHead className="w-44">Status</TableHead>
                <TableHead className="w-32">Priority</TableHead>
                <TableHead className="w-40">Assignee</TableHead>
                <TableHead className="w-28">Created</TableHead>
                <TableHead className="w-36 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-28 text-center text-muted-foreground">
                    Loading assigned tickets...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-28 text-center text-muted-foreground">
                    No assigned tickets match these filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    className="cursor-pointer align-top hover:bg-muted/30"
                    onClick={() => openTicket(ticket)}
                  >
                    <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                      TK-{String(ticket.id).padStart(4, "0")}
                    </TableCell>
                    <TableCell className="font-medium">
                      <span className="line-clamp-2 break-words">{ticket.title}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <span className="line-clamp-2 break-words">
                        {getBodyPreview(ticket.body)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="line-clamp-2 break-words">{ticket.requester}</span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={ticket.status} />
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={ticket.priorityId ? ticket.priority : "Unassigned"} />
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="line-clamp-2 break-words">
                        {ticket.assignee || user?.name || "Assigned to you"}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(ticket.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openTicket(ticket);
                        }}
                        className="rounded-md border border-border px-3 py-1 text-sm font-medium hover:bg-muted"
                      >
                        View
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Sheet open={selectedTicket !== null} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <SheetContent side="right" className="flex w-full flex-col overflow-y-auto sm:max-w-xl">
          {selectedTicket && (
            <>
              <SheetHeader className="pr-8">
                <SheetTitle>{selectedTicket.title}</SheetTitle>
                <SheetDescription>
                  TK-{String(selectedTicket.id).padStart(4, "0")}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Requester</p>
                    <p className="font-medium">{selectedTicket.requester}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium">{formatDate(selectedTicket.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Current status</p>
                    <div className="mt-1">
                      <StatusBadge status={selectedTicket.status} />
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Current priority</p>
                    <div className="mt-1">
                      <PriorityBadge
                        priority={
                          selectedTicket.priorityId
                            ? selectedTicket.priority
                            : "Unassigned"
                        }
                      />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Current assignee</p>
                    <p className="font-medium">
                      {selectedTicket.assignee || user?.name || "Assigned to you"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Full body</Label>
                  <div className="min-h-32 whitespace-pre-wrap rounded-lg border bg-muted/30 p-3 text-sm leading-6">
                    {selectedTicket.body?.trim() || "No body provided."}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Label className="flex items-center gap-2">
                      <Paperclip className="h-4 w-4" />
                      Attachments
                    </Label>
                    <span className="rounded-full border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      {attachments.length}
                    </span>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-3">
                    {attachments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No attachments.</p>
                    ) : (
                      <ul className="space-y-2">
                        {attachments.map((attachment) => (
                          <li key={attachment.id}>
                            <a
                              href={getAttachmentUrl(attachment)}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2 text-sm hover:bg-muted"
                            >
                              <span className="truncate font-medium">
                                {attachment.fileName}
                              </span>
                              <span className="shrink-0 text-xs text-muted-foreground">
                                {formatAttachmentSize(attachment.sizeBytes)}
                              </span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Label className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Conversation
                    </Label>
                    <span className="rounded-full border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      {comments.length} {comments.length === 1 ? "reply" : "replies"}
                    </span>
                  </div>
                  <div className="max-h-56 space-y-3 overflow-y-auto rounded-lg border bg-muted/20 p-3">
                    {comments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No replies yet.</p>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="rounded-lg bg-white p-3 text-sm">
                          <div className="mb-1 flex items-center justify-between gap-3">
                            <span className="font-medium">
                              {comment.authorName || comment.authorType}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap text-muted-foreground">
                            {comment.body}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="staff-ticket-reply">Message</Label>
                  <Textarea
                    id="staff-ticket-reply"
                    value={replyBody}
                    onChange={(event) => setReplyBody(event.target.value)}
                    className="min-h-28"
                    placeholder="Write a message for this ticket conversation..."
                  />
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddSystemMessage}
                      disabled={
                        addingSystemMessage ||
                        sendingReply ||
                        savingDetails ||
                        !replyBody.trim()
                      }
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      {addingSystemMessage ? "Adding..." : "Add to conversation"}
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSendReply}
                      disabled={
                        addingSystemMessage ||
                        sendingReply ||
                        savingDetails ||
                        !replyBody.trim()
                      }
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      {sendingReply ? "Sending..." : "Send email reply"}
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="staff-ticket-status">Status</Label>
                    <select
                      id="staff-ticket-status"
                      value={draftStatusId}
                      onChange={(event) => setDraftStatusId(event.target.value)}
                      className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="" disabled>
                        Select status
                      </option>
                      {editableStatuses.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="staff-ticket-priority">Priority</Label>
                    <select
                      id="staff-ticket-priority"
                      value={draftPriorityId}
                      onChange={(event) => setDraftPriorityId(event.target.value)}
                      className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="" disabled>
                        Select priority
                      </option>
                      {priorities.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <SheetFooter className="mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedTicket(null)}
                  disabled={savingDetails || sendingReply || addingSystemMessage}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveChanges}
                  disabled={savingDetails || sendingReply || addingSystemMessage}
                >
                  {savingDetails ? "Saving..." : "Save changes"}
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
