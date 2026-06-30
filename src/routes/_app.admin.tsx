import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, CircleDot, Clock3, MessageSquare, Paperclip, Search, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import {
  addTicketComment,
  deleteTicket,
  getAttachmentUrl,
  getTicketAttachments,
  getTicketComments,
  replyToTicket,
  searchTickets,
  updateTicket,
  type Ticket,
  type TicketAttachment,
  type TicketComment,
} from "../api/ticketApi";
import {
  getPriorities,
  getRoles,
  getStatuses,
  getUsers,
  type LookupItem,
  type UserLookupItem,
} from "../api/lookupApi";
import { createUser } from "../api/userApi";
import { API_BASE_URL } from "../api/http";
import { NewTicketModal } from "../components/NewTicketModal";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_app/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard - Helpdesk" }] }),
  component: AdminPage,
});

const ALL_FILTER = "All";
const ALL_PRIORITY_FILTER = "all-priorities";
const TICKET_PAGE_SIZE = 50;
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

function formatAttachmentSize(sizeBytes: number) {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  return `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`;
}

function getBodyPreview(body?: string) {
  if (!body?.trim()) return "-";

  return body.length > 72 ? `${body.slice(0, 72)}...` : body;
}

function getStatusIdByName(statuses: LookupItem[], name: string) {
  return statuses.find((status) => status.name === name)?.id;
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
  if (normalized === "resolved") return "Needs review";
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

  if (normalized === "new") {
    return "border-indigo-200 bg-indigo-50 text-indigo-700";
  }

  if (normalized === "pending") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (normalized === "in progress") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  if (normalized === "resolved") {
    return "border-teal-200 bg-teal-50 text-teal-700";
  }

  if (normalized === "closed") {
    return "border-slate-300 bg-slate-100 text-slate-700";
  }

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

  if (normalized === "critical") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (normalized === "high") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (normalized === "medium") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (normalized === "low") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

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

interface TicketSummary {
  totalCount: number;
  allCount: number;
  activeCount: number;
  pendingCount: number;
  resolvedCount: number;
  closedCount: number;
  statusCounts: Record<number, number>;
}

const EMPTY_TICKET_SUMMARY: TicketSummary = {
  totalCount: 0,
  allCount: 0,
  activeCount: 0,
  pendingCount: 0,
  resolvedCount: 0,
  closedCount: 0,
  statusCounts: {},
};

function AdminPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [statuses, setStatuses] = useState<LookupItem[]>([]);
  const [priorities, setPriorities] = useState<LookupItem[]>([]);
  const [users, setUsers] = useState<UserLookupItem[]>([]);
  const [roles, setRoles] = useState<LookupItem[]>([]);
  const [status, setStatus] = useState(ALL_FILTER);
  const [priority, setPriority] = useState(ALL_PRIORITY_FILTER);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [ticketSummary, setTicketSummary] = useState<TicketSummary>(EMPTY_TICKET_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [replyBody, setReplyBody] = useState("");
  const [draftStatusId, setDraftStatusId] = useState("");
  const [draftPriorityId, setDraftPriorityId] = useState("");
  const [draftUserId, setDraftUserId] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [addingSystemMessage, setAddingSystemMessage] = useState(false);
  const [deletingTicket, setDeletingTicket] = useState(false);
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPhone, setStaffPhone] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffRoleId, setStaffRoleId] = useState("");
  const [savingStaff, setSavingStaff] = useState(false);
  const [staffError, setStaffError] = useState("");
  const selectedTicketRef = useRef<Ticket | null>(null);
  const loadDashboardDataRef = useRef(loadDashboardData);
  const statusesRef = useRef<LookupItem[]>([]);
  const prioritiesRef = useRef<LookupItem[]>([]);
  const usersRef = useRef<UserLookupItem[]>([]);

  function normalizeTicketLookups(
    ticket: Ticket,
    statusData = statusesRef.current,
    priorityData = prioritiesRef.current,
    userData = usersRef.current,
  ): Ticket {
    return {
      ...ticket,
      status:
        statusData.find((status) => status.id === ticket.statusId)?.name ??
        ticket.status,
      priority:
        priorityData.find((priority) => priority.id === ticket.priorityId)?.name ??
        ticket.priority,
      assignee:
        userData.find((user) => user.id === ticket.userId)?.name ??
        ticket.assignee,
    };
  }

  function applyTicketPatch(ticketId: number, patch: Partial<Ticket>) {
    setTickets((currentTickets) =>
      currentTickets.map((ticket) =>
        ticket.id === ticketId ? normalizeTicketLookups({ ...ticket, ...patch }) : ticket,
      ),
    );

    setSelectedTicket((currentTicket) =>
      currentTicket?.id === ticketId
        ? normalizeTicketLookups({ ...currentTicket, ...patch })
        : currentTicket,
    );
  }

  function getTicketPatchFromDraft(ticket: Ticket): Partial<Ticket> {
    return {
      statusId: draftStatusId ? Number(draftStatusId) : ticket.statusId,
      priorityId: draftPriorityId ? Number(draftPriorityId) : ticket.priorityId,
      userId: draftUserId ? Number(draftUserId) : null,
    };
  }

  async function loadLookupData() {
    const [statusData, priorityData, userData, roleData] = await Promise.all([
      getStatuses(),
      getPriorities(),
      getUsers(),
      getRoles(),
    ]);

    setStatuses(statusData);
    setPriorities(priorityData);
    setUsers(userData);
    setRoles(roleData);
    statusesRef.current = statusData;
    prioritiesRef.current = priorityData;
    usersRef.current = userData;
  }

  async function loadDashboardData(showLoading = true, notifyConversationChanges = false) {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError("");

      const statusId =
        status === ALL_FILTER
          ? undefined
          : statusesRef.current.find((item) => item.name === status)?.id;
      const priorityId =
        priority === ALL_PRIORITY_FILTER ? undefined : Number(priority);
      const ticketResult = await searchTickets({
        page,
        pageSize: TICKET_PAGE_SIZE,
        statusId,
        priorityId,
        search: debouncedQuery,
      });

      setTicketSummary({
        totalCount: ticketResult.totalCount,
        allCount: ticketResult.allCount,
        activeCount: ticketResult.activeCount,
        pendingCount: ticketResult.pendingCount,
        resolvedCount: ticketResult.resolvedCount,
        closedCount: ticketResult.closedCount,
        statusCounts: ticketResult.statusCounts,
      });

      const mappedTickets = ticketResult.items.map((ticket) =>
        normalizeTicketLookups(ticket),
      );

      setTickets((currentTickets) => {
        if (notifyConversationChanges && currentTickets.length > 0) {
          mappedTickets.forEach((ticket) => {
            const previous = currentTickets.find((current) => current.id === ticket.id);
            const previousCount = previous?.commentCount ?? 0;
            const nextCount = ticket.commentCount ?? 0;

            if (previous && nextCount > previousCount) {
              toast.info(`New reply on TK-${String(ticket.id).padStart(4, "0")}`, {
                description: "Open the ticket conversation to review it.",
              });
            }
          });
        }

        return mappedTickets;
      });
    } catch (err) {
      console.error("Failed to load dashboard data:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load dashboard data.",
      );
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }

  async function openTicketDrawer(ticket: Ticket) {
    setSelectedTicket(ticket);
    setReplyBody("");
    setComments([]);
    setAttachments([]);
    setDraftStatusId(ticket.statusId ? String(ticket.statusId) : "");
    setDraftPriorityId(ticket.priorityId ? String(ticket.priorityId) : "");
    setDraftUserId(ticket.userId != null ? String(ticket.userId) : "");

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

  async function saveTicketDetails(ticket: Ticket) {
    await updateTicket(ticket.id, {
      title: ticket.title,
      body: ticket.body ?? "",
      statusId: draftStatusId ? Number(draftStatusId) : undefined,
      priorityId: draftPriorityId ? Number(draftPriorityId) : undefined,
      userId: draftUserId ? Number(draftUserId) : null,
    });
  }

  async function sendTicketReply(ticket: Ticket) {
    const body = replyBody.trim();
    const optimisticReply: TicketComment = {
      id: -Date.now(),
      ticketId: ticket.id,
      body,
      authorName: "Admin",
      authorEmail: null,
      authorType: "Agent",
      isInternalNote: false,
      userId: null,
      createdAt: new Date().toISOString(),
    };

    setComments((current) => [...current, optimisticReply]);
    setReplyBody("");

    let reply: TicketComment;
    try {
      reply = await replyToTicket(ticket.id, {
        body,
        authorName: "Admin",
      });
    } catch (err) {
      setComments((current) =>
        current.filter((comment) => comment.id !== optimisticReply.id),
      );
      setReplyBody(body);
      throw err;
    }

    setComments((current) =>
      current.map((comment) => (comment.id === optimisticReply.id ? reply : comment)),
    );
    setTickets((currentTickets) =>
      currentTickets.map((currentTicket) =>
        currentTicket.id === ticket.id
          ? {
              ...currentTicket,
              commentCount: (currentTicket.commentCount ?? 0) + 1,
              lastCommentAt: reply.createdAt,
            }
          : currentTicket,
      ),
    );
  }

  async function addSystemConversationMessage(ticket: Ticket) {
    const body = replyBody.trim();
    const optimisticComment: TicketComment = {
      id: -Date.now(),
      ticketId: ticket.id,
      body,
      authorName: "Admin",
      authorEmail: null,
      authorType: "Agent",
      isInternalNote: false,
      userId: null,
      createdAt: new Date().toISOString(),
    };

    setComments((current) => [...current, optimisticComment]);
    setReplyBody("");

    let comment: TicketComment;
    try {
      comment = await addTicketComment(ticket.id, {
        body,
        authorName: "Admin",
        authorType: "Agent",
        isInternalNote: false,
      });
    } catch (err) {
      setComments((current) =>
        current.filter((item) => item.id !== optimisticComment.id),
      );
      setReplyBody(body);
      throw err;
    }

    setComments((current) =>
      current.map((item) => (item.id === optimisticComment.id ? comment : item)),
    );
    setTickets((currentTickets) =>
      currentTickets.map((currentTicket) =>
        currentTicket.id === ticket.id
          ? {
              ...currentTicket,
              commentCount: (currentTicket.commentCount ?? 0) + 1,
              lastCommentAt: comment.createdAt,
            }
          : currentTicket,
      ),
    );
  }

  async function handleSaveTicketDetails() {
    if (!selectedTicket) return;

    const ticketBeforeSave = selectedTicket;
    const optimisticPatch = getTicketPatchFromDraft(selectedTicket);

    try {
      setSavingDetails(true);
      applyTicketPatch(selectedTicket.id, optimisticPatch);
      setSelectedTicket(null);

      await saveTicketDetails(selectedTicket);
      void loadDashboardData(false);
    } catch (err) {
      console.error("Failed to update ticket:", err);
      applyTicketPatch(ticketBeforeSave.id, ticketBeforeSave);
      setSelectedTicket(ticketBeforeSave);
      alert(err instanceof Error ? err.message : "Failed to update ticket. Please try again.");
    } finally {
      setSavingDetails(false);
    }
  }

  async function handleDeleteTicket() {
    if (!ticketToDelete) return;

    try {
      setDeletingTicket(true);
      await deleteTicket(ticketToDelete.id);
      setTickets((currentTickets) =>
        currentTickets.filter((ticket) => ticket.id !== ticketToDelete.id),
      );
      setTicketToDelete(null);
      void loadDashboardData(false);
    } catch (err) {
      console.error("Failed to delete ticket:", err);
      toast.error("Ticket was not deleted", {
        description: "Please try again or check the server connection.",
      });
    } finally {
      setDeletingTicket(false);
    }
  }

  async function handleSendReply() {
    if (!selectedTicket || !replyBody.trim()) return;

    try {
      setSendingReply(true);

      await sendTicketReply(selectedTicket);
    } catch (err) {
      console.error("Failed to send reply:", err);
      alert("Failed to send reply email. Please check SMTP settings and try again.");
    } finally {
      setSendingReply(false);
    }
  }

  async function handleAddSystemMessage() {
    if (!selectedTicket || !replyBody.trim()) return;

    try {
      setAddingSystemMessage(true);

      await addSystemConversationMessage(selectedTicket);
    } catch (err) {
      console.error("Failed to add system conversation message:", err);
      alert("Failed to add the message to the system conversation.");
    } finally {
      setAddingSystemMessage(false);
    }
  }

  async function handleAdminReviewStatus(nextStatusName: "Closed" | "In Progress") {
    if (!selectedTicket) return;

    const nextStatusId = getStatusIdByName(statuses, nextStatusName);
    if (!nextStatusId) {
      alert(`${nextStatusName} status is missing from the database.`);
      return;
    }

    try {
      setSavingDetails(true);
      await updateTicket(selectedTicket.id, {
        title: selectedTicket.title,
        body: selectedTicket.body ?? "",
        statusId: nextStatusId,
      });
      applyTicketPatch(selectedTicket.id, { statusId: nextStatusId });
      setSelectedTicket(null);
      void loadDashboardData(false);
    } catch (err) {
      console.error("Failed to review resolved ticket:", err);
      alert("Failed to update ticket review status.");
    } finally {
      setSavingDetails(false);
    }
  }

  async function handleCreateStaff(event: React.FormEvent) {
    event.preventDefault();

    if (!staffName.trim() || !staffEmail.trim() || !staffPassword || !staffRoleId) {
      setStaffError("Name, email, password, and role are required.");
      return;
    }

    try {
      setSavingStaff(true);
      setStaffError("");

      await createUser({
        name: staffName.trim(),
        email: staffEmail.trim(),
        phoneNumber: staffPhone.trim(),
        password: staffPassword,
        roleId: Number(staffRoleId),
      });

      setStaffName("");
      setStaffEmail("");
      setStaffPhone("");
      setStaffPassword("");
      setStaffRoleId("");
      setIsStaffModalOpen(false);
      const refreshedUsers = await getUsers();
      setUsers(refreshedUsers);
      usersRef.current = refreshedUsers;
    } catch (err) {
      console.error("Failed to create staff user:", err);
      setStaffError(err instanceof Error ? err.message : "Failed to create staff user.");
    } finally {
      setSavingStaff(false);
    }
  }

  useEffect(() => {
    void loadLookupData().catch((err) => {
      console.error("Failed to load lookup data:", err);
      setError(err instanceof Error ? err.message : "Failed to load lookup data.");
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [status, priority, debouncedQuery]);

  useEffect(() => {
    if (statuses.length === 0) {
      return;
    }

    void loadDashboardData();
  }, [statuses, status, priority, debouncedQuery, page]);

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
    loadDashboardDataRef.current = loadDashboardData;
  });

  useEffect(() => {
    const eventSource = new EventSource(`${API_BASE_URL}/Notifications/stream`);

    eventSource.addEventListener("ticket-comment-added", (event) => {
      const data = JSON.parse(event.data) as {
        ticketId: number;
        message?: string;
      };
      const openTicket = selectedTicketRef.current;

      setTickets((currentTickets) =>
        currentTickets.map((ticket) =>
          ticket.id === data.ticketId
            ? {
                ...ticket,
                commentCount: (ticket.commentCount ?? 0) + 1,
                lastCommentAt: new Date().toISOString(),
              }
            : ticket,
        ),
      );

      if (openTicket?.id === data.ticketId) {
        void getTicketComments(data.ticketId)
          .then((ticketComments) => {
            setComments(ticketComments);
            toast.info("Conversation updated", {
              description: data.message ?? `TK-${String(data.ticketId).padStart(4, "0")} has a new reply.`,
            });
          })
          .catch((err) => {
            console.error("Failed to load live ticket comments:", err);
          });

        return;
      }

      toast.info("New reply received", {
        description: data.message ?? `TK-${String(data.ticketId).padStart(4, "0")} has a new reply.`,
      });
    });

    eventSource.addEventListener("ticket-created", () => {
      void loadDashboardDataRef.current(false);
    });

    eventSource.addEventListener("ticket-status-changed", () => {
      void loadDashboardDataRef.current(false);
    });

    eventSource.addEventListener("ticket-needs-admin-review", (event) => {
      const data = JSON.parse(event.data) as {
        ticketId: number;
        message?: string;
      };

      toast.info("Admin review needed", {
        description:
          data.message ??
          `TK-${String(data.ticketId).padStart(4, "0")} was marked resolved.`,
        action: {
          label: "Review",
          onClick: () => {
            setStatus("Resolved");
            setPage(1);
          },
        },
      });

      void loadDashboardDataRef.current(false);
    });

    eventSource.onerror = () => {
      console.warn("Live ticket notification stream disconnected. Browser will retry.");
    };

    return () => eventSource.close();
  }, []);

  const pageCount = Math.max(1, Math.ceil(ticketSummary.totalCount / TICKET_PAGE_SIZE));

  const statusFilters = useMemo(() => {
    const allFilter = {
      id: 0,
      name: ALL_FILTER,
      count: ticketSummary.allCount,
    };

    const statusFiltersFromData = statuses
      .map((item) => ({
        ...item,
        count: ticketSummary.statusCounts[item.id] ?? 0,
      }))
      .sort((a, b) => getStatusSortValue(a.name) - getStatusSortValue(b.name));

    return [allFilter, ...statusFiltersFromData];
  }, [statuses, ticketSummary.allCount, ticketSummary.statusCounts]);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading tickets...</div>;
  }

  if (error) {
    return (
      <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-sm text-destructive">{error}</p>
        <Button onClick={loadDashboardData} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="rounded-xl border bg-card p-3">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">Ticket status</p>
              <p className="text-xs text-muted-foreground">
                {tickets.length} of {ticketSummary.totalCount} shown
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setIsNewTicketOpen(true)}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
              >
                + New ticket
              </button>
              <button
                type="button"
                onClick={() => setIsStaffModalOpen(true)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                + Add staff
              </button>
            </div>
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
              onChange={(e) => setQuery(e.target.value)}
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
              {priorities.map((priority) => (
                <SelectItem key={priority.id} value={String(priority.id)}>
                  {priority.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {tickets.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-xl border border-dashed bg-card text-sm text-muted-foreground">
            No tickets match these filters.
          </div>
        ) : (
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
                {tickets.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    onClick={() => openTicketDrawer(ticket)}
                    className="cursor-pointer align-top hover:bg-muted/30"
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
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={ticket.status} />
                        {ticket.status === "Resolved" && (
                          <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold leading-none text-primary">
                            Needs review
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <PriorityBadge
                        priority={ticket.priorityId ? ticket.priority : "Unassigned"}
                      />
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="line-clamp-2 break-words">
                        {ticket.assignee || "Unassigned"}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openTicketDrawer(ticket);
                        }}
                        className="mb-1 mr-2 rounded-md border border-border px-3 py-1 text-sm font-medium hover:bg-muted"
                      >
                        {ticket.status === "Resolved" ? "Review" : "View"}
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setTicketToDelete(ticket);
                        }}
                        className="rounded-md border border-red-200 px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm">
              <span className="text-muted-foreground">
                Page {page} of {pageCount}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                  disabled={page >= pageCount || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <NewTicketModal
        open={isNewTicketOpen}
        onClose={() => setIsNewTicketOpen(false)}
        onCreated={() => {
          setPage(1);
          void loadDashboardData(false);
        }}
      />

      <AlertDialog
        open={ticketToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deletingTicket) {
            setTicketToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this ticket?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove TK-
              {ticketToDelete ? String(ticketToDelete.id).padStart(4, "0") : "----"} from the
              active ticket board. The ticket will be hidden from normal views.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {ticketToDelete && (
            <div className="rounded-lg border bg-muted/40 p-3 text-sm">
              <p className="font-medium">{ticketToDelete.title}</p>
              <p className="mt-1 text-muted-foreground">
                Requested by {ticketToDelete.requester}
              </p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingTicket}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteTicket}
              disabled={deletingTicket}
            >
              {deletingTicket ? "Deleting..." : "Delete ticket"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Add staff user</h2>
              <button
                type="button"
                onClick={() => setIsStaffModalOpen(false)}
                className="rounded-md px-2 py-1 text-muted-foreground hover:bg-muted"
              >
                x
              </button>
            </div>

            {staffError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {staffError}
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <Label>Name</Label>
                <input
                  value={staffName}
                  onChange={(event) => setStaffName(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <Label>Email</Label>
                <input
                  value={staffEmail}
                  onChange={(event) => setStaffEmail(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <Label>Phone number</Label>
                <input
                  value={staffPhone}
                  onChange={(event) => setStaffPhone(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <Label>Password</Label>
                <input
                  type="password"
                  value={staffPassword}
                  onChange={(event) => setStaffPassword(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <Label>Role</Label>
                <select
                  value={staffRoleId}
                  onChange={(event) => setStaffRoleId(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="" disabled>
                    Select role
                  </option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingStaff}
                  className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingStaff ? "Creating..." : "Create staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                    <p className="font-medium">
                      {selectedTicket.createdAt
                        ? new Date(selectedTicket.createdAt).toLocaleDateString()
                        : "-"}
                    </p>
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
                    <p className="font-medium">{selectedTicket.assignee || "Unassigned"}</p>
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

                {selectedTicket.status === "Resolved" && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <p className="font-medium">Staff marked this ticket as resolved</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Review the conversation and requester details. Close it if the work is complete, or return it to staff if more work is needed.
                    </p>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <Button
                        type="button"
                        onClick={() => handleAdminReviewStatus("Closed")}
                        disabled={savingDetails || sendingReply}
                      >
                        Approve and close
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleAdminReviewStatus("In Progress")}
                        disabled={savingDetails || sendingReply}
                      >
                        Return to in progress
                      </Button>
                    </div>
                  </div>
                )}

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
                  <Label htmlFor="ticket-reply">Message</Label>
                  <textarea
                    id="ticket-reply"
                    value={replyBody}
                    onChange={(event) => setReplyBody(event.target.value)}
                    className="min-h-28 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
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
                      {sendingReply ? "Sending..." : "Send email reply"}
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ticket-status">Status</Label>
                    <select
                      id="ticket-status"
                      value={draftStatusId}
                      onChange={(event) => setDraftStatusId(event.target.value)}
                      className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="" disabled>
                        Select status
                      </option>

                      {statuses.map((status) => (
                        <option key={status.id} value={status.id}>
                          {status.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ticket-priority">Priority</Label>
                    <select
                      id="ticket-priority"
                      value={draftPriorityId}
                      onChange={(event) => setDraftPriorityId(event.target.value)}
                      className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="" disabled>
                        Select priority
                      </option>

                      {priorities.map((priority) => (
                        <option key={priority.id} value={priority.id}>
                          {priority.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ticket-assignee">Assignee</Label>
                    <select
                      id="ticket-assignee"
                      value={draftUserId}
                      onChange={(event) => setDraftUserId(event.target.value)}
                      className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">Unassigned</option>

                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
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
                  disabled={savingDetails || sendingReply}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveTicketDetails}
                  disabled={savingDetails || sendingReply}
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
