import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DashboardHeader } from "./components/DashboardHeader";
import { NewTicketDialog } from "./components/NewTicketDialog";
import { StaffDialog } from "./components/StaffDialog";
import { StatusFilterSection, type StatusFilterItem } from "./components/StatusFilterSection";
import { TicketDrawer } from "./components/TicketDrawer";
import { TicketTableSection } from "./components/TicketTableSection";
import type { AuthSession } from "@/lib/auth-service";
import { overviewService, type TicketOverview } from "@/lib/overview-service";
import { roleService } from "@/lib/role-service";
import { statusService } from "@/lib/status-service";
import {
  ticketService,
  type CreateTicketWithAttachmentsRequest,
  type TicketSearchResponse,
} from "@/lib/ticket-service";
import { userService, type CreateUserRequest } from "@/lib/user-service";
import {
  staticAttachments,
  staticComments,
  staticTickets,
  staticUsers,
  type LookupItem,
  type Ticket,
  type TicketAttachment,
  type TicketComment,
  type UserLookupItem,
} from "./dashboard-data";
import { ALL_USERS, useDebouncedValue } from "./dashboard-utils";

const ALL_STATUSES = "all-statuses";

interface DashboardPageProps {
  session: AuthSession;
  onLogout: () => void;
}

function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCurrentWeekRange() {
  const today = new Date();
  const start = new Date(today);
  const day = today.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;

  start.setDate(today.getDate() - daysSinceMonday);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    startDate: formatDateInputValue(start),
    endDate: formatDateInputValue(end),
  };
}

export function DashboardPage({ session, onLogout }: DashboardPageProps) {
  const currentUser = {
    id: session.userId,
    name: session.name,
    email: session.email,
    role: session.role,
  };
  const [tickets, setTickets] = useState<Ticket[]>(staticTickets);
  const [statuses, setStatuses] = useState<LookupItem[]>([]);
  const [roles, setRoles] = useState<LookupItem[]>([]);
  const [users, setUsers] = useState<UserLookupItem[]>(staticUsers);
  const [comments, setComments] = useState<TicketComment[]>(staticComments);
  const [attachments, setAttachments] = useState<TicketAttachment[]>(staticAttachments);
  const [userFilter, setUserFilter] = useState(ALL_USERS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(ALL_STATUSES);
  const [page, setPage] = useState(1);
  const [ticketSearch, setTicketSearch] = useState<TicketSearchResponse | null>(null);
  const [overviewDateRange, setOverviewDateRange] = useState(getCurrentWeekRange);
  const [ticketOverview, setTicketOverview] = useState<TicketOverview | null>(null);
  const [isTicketsLoading, setIsTicketsLoading] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [isStaffDialogOpen, setIsStaffDialogOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search);
  const isAdmin = currentUser.role === "admin";
  const userId = userFilter === ALL_USERS ? undefined : Number(userFilter);
  const statusId = statusFilter === ALL_STATUSES ? undefined : Number(statusFilter);
  const ticketUserId = isAdmin ? userId : currentUser.id;
  const overviewUserId = isAdmin ? undefined : currentUser.id;
  const pageSize = ticketSearch?.pageSize ?? 50;
  const totalCount = ticketSearch?.totalCount ?? tickets.length;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const selectedTicket = tickets.find((ticket) => ticket.id === selectedTicketId) ?? null;
  const selectedComments = comments.filter((comment) => comment.ticketId === selectedTicketId);
  const selectedAttachments = attachments.filter(
    (attachment) => attachment.ticketId === selectedTicketId,
  );

  const statusFilters: StatusFilterItem[] = useMemo(() => {
    if (ticketOverview) {
      return ticketOverview.statuses;
    }

    return statuses.map((status) => ({ ...status, count: 0 }));
  }, [statuses, ticketOverview]);

  const fetchOverview = useCallback(() => {
    return overviewService.getTicketOverview({
      startDate: overviewDateRange.startDate,
      endDate: overviewDateRange.endDate,
      userId: overviewUserId,
    });
  }, [overviewDateRange.endDate, overviewDateRange.startDate, overviewUserId]);

  const refreshOverview = useCallback(async () => {
    const overview = await fetchOverview();

    setTicketOverview(overview);
  }, [fetchOverview]);

  const refreshOverviewSafely = useCallback(async () => {
    try {
      await refreshOverview();
    } catch {
      toast.error("Failed to refresh overview");
    }
  }, [refreshOverview]);

  useEffect(() => {
    setPage(1);
  }, [
    debouncedSearch,
    overviewDateRange.endDate,
    overviewDateRange.startDate,
    userFilter,
    statusFilter,
  ]);

  useEffect(() => {
    let ignore = false;

    Promise.allSettled([userService.getUsers(), statusService.getStatuses()]).then(
      ([usersResult, statusesResult]) => {
        if (ignore) return;

        if (usersResult.status === "fulfilled") {
          setUsers(usersResult.value);
        } else {
          setUsers([]);
          toast.error("Failed to load users");
        }

        if (statusesResult.status === "fulfilled") {
          setStatuses(statusesResult.value);
        } else {
          setStatuses([]);
          toast.error("Failed to load statuses");
        }
      },
    );

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      setRoles([]);
      return undefined;
    }

    let ignore = false;

    roleService
      .getRoles()
      .then((loadedRoles) => {
        if (!ignore) {
          setRoles(loadedRoles);
        }
      })
      .catch(() => {
        if (!ignore) {
          setRoles([]);
          toast.error("Failed to load roles");
        }
      });

    return () => {
      ignore = true;
    };
  }, [isAdmin]);

  useEffect(() => {
    let ignore = false;

    fetchOverview()
      .then((overview) => {
        if (!ignore) {
          setTicketOverview(overview);
        }
      })
      .catch(() => {
        if (!ignore) {
          setTicketOverview(null);
          toast.error("Failed to load overview");
        }
      });

    return () => {
      ignore = true;
    };
  }, [fetchOverview]);

  useEffect(() => {
    let ignore = false;

    setIsTicketsLoading(true);
    ticketService
      .getTickets({
        page,
        userId: ticketUserId,
        statusId,
        search: debouncedSearch.trim() || undefined,
        startDate: overviewDateRange.startDate,
        endDate: overviewDateRange.endDate,
      })
      .then((response) => {
        if (!ignore) {
          setTicketSearch(response);
          setTickets(response.items);
        }
      })
      .catch(() => {
        if (!ignore) {
          toast.error("Failed to load tickets");
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsTicketsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [
    debouncedSearch,
    overviewDateRange.endDate,
    overviewDateRange.startDate,
    page,
    ticketUserId,
    statusId,
  ]);

  useEffect(() => {
    if (!selectedTicketId) return;

    let ignore = false;

    Promise.allSettled([
      ticketService.getComments(selectedTicketId),
      ticketService.getAttachments(selectedTicketId),
    ]).then(([commentsResult, attachmentsResult]) => {
      if (ignore) return;

      if (commentsResult.status === "fulfilled") {
        setComments((current) => [
          ...current.filter((comment) => comment.ticketId !== selectedTicketId),
          ...commentsResult.value,
        ]);
      } else {
        toast.error("Failed to load ticket replies");
      }

      if (attachmentsResult.status === "fulfilled") {
        setAttachments((current) => [
          ...current.filter((attachment) => attachment.ticketId !== selectedTicketId),
          ...attachmentsResult.value,
        ]);
      } else {
        toast.error("Failed to load ticket attachments");
      }
    });

    return () => {
      ignore = true;
    };
  }, [selectedTicketId]);

  const addTicket = async (request: CreateTicketWithAttachmentsRequest) => {
    const createdTicket = await ticketService.createTicketWithAttachments(request);

    setTickets((current) => [
      {
        id: createdTicket.id,
        title: createdTicket.title,
        body: createdTicket.body,
        requester: createdTicket.requester,
        requesterEmail: createdTicket.requesterEmail,
        statusId: createdTicket.statusId,
        status: statuses.find((status) => status.id === createdTicket.statusId)?.name ?? "N/A",
        userId: createdTicket.userId,
        assignee: null,
        createdAt: createdTicket.createdAt,
        commentCount: 0,
        lastCommentAt: null,
      },
      ...current,
    ]);

    if (createdTicket.attachments?.length) {
      setAttachments((current) => [...current, ...createdTicket.attachments!]);
    }

    await refreshOverviewSafely();
  };

  const addStaffUser = async (request: CreateUserRequest) => {
    await userService.createUser(request);
    const refreshedUsers = await userService.getUsers();
    setUsers(refreshedUsers);
  };

  const saveTicket = async (updatedTicket: Ticket) => {
    const savedTicket = await ticketService.updateTicket(updatedTicket.id, {
      title: updatedTicket.title,
      body: updatedTicket.body,
      ...(isAdmin && updatedTicket.userId ? { userId: updatedTicket.userId } : {}),
    });

    setTickets((current) =>
      current.map((ticket) => (ticket.id === savedTicket.id ? savedTicket : ticket)),
    );
    await refreshOverviewSafely();
  };

  const cancelTicket = async (ticketId: number) => {
    const cancelledTicket = await ticketService.cancelTicket(ticketId);
    setTickets((current) =>
      current.map((ticket) => (ticket.id === cancelledTicket.id ? cancelledTicket : ticket)),
    );
    await refreshOverviewSafely();
    setSelectedTicketId(null);
  };

  const closeTicket = async (ticketId: number, body: string) => {
    const closedTicket = await ticketService.closeTicket(ticketId, {
      body,
      authorName: currentUser.name,
      authorEmail: currentUser.email,
      userId: currentUser.role === "admin" ? null : currentUser.id,
    });
    const refreshedComments = await ticketService.getComments(ticketId);

    setTickets((current) =>
      current.map((ticket) => (ticket.id === closedTicket.id ? closedTicket : ticket)),
    );
    setComments((current) => [
      ...current.filter((comment) => comment.ticketId !== ticketId),
      ...refreshedComments,
    ]);
    await refreshOverviewSafely();
    setSelectedTicketId(null);
  };

  const addComment = async (comment: Omit<TicketComment, "id" | "createdAt">) => {
    const createdComment = await ticketService.addComment(comment.ticketId, {
      body: comment.body,
      authorName: comment.authorName,
      authorEmail: comment.authorEmail,
      authorType: comment.authorType,
      isInternalNote: comment.isInternalNote,
      userId: comment.userId,
    });

    setComments((current) => [...current, createdComment]);
  };

  const replyToRequester = async (
    reply: Omit<TicketComment, "id" | "createdAt" | "isInternalNote">,
  ) => {
    const createdReply = await ticketService.replyToRequester(reply.ticketId, {
      body: reply.body,
      authorName: reply.authorName,
      authorEmail: reply.authorEmail,
      userId: reply.userId,
    });

    setComments((current) => [...current, createdReply]);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="relative min-h-screen">
        <DashboardHeader
          isAdmin={isAdmin}
          user={currentUser}
          onAddStaff={() => setIsStaffDialogOpen(true)}
          onNewTicket={() => setIsNewTicketOpen(true)}
          onLogout={onLogout}
        />

        <main className="w-full space-y-4 px-4 py-4 lg:px-6">
          <StatusFilterSection
            statusFilters={statusFilters}
            dailyTickets={ticketOverview?.dailyTickets ?? []}
            totalCount={ticketOverview?.totalCount ?? 0}
            search={search}
            userFilter={userFilter}
            statusFilter={statusFilter}
            showUserFilter={isAdmin}
            users={users}
            statuses={statuses}
            startDate={overviewDateRange.startDate}
            endDate={overviewDateRange.endDate}
            onSearchChange={setSearch}
            onUserChange={setUserFilter}
            onStatusChange={setStatusFilter}
            onStartDateChange={(startDate) =>
              setOverviewDateRange((current) => ({ ...current, startDate }))
            }
            onEndDateChange={(endDate) =>
              setOverviewDateRange((current) => ({ ...current, endDate }))
            }
          />
          <TicketTableSection
            tickets={tickets}
            isAdmin={isAdmin}
            isLoading={isTicketsLoading}
            currentUser={currentUser}
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
            onSelectTicket={(ticket) => setSelectedTicketId(ticket.id)}
          />
        </main>

        <NewTicketDialog
          open={isNewTicketOpen}
          onOpenChange={setIsNewTicketOpen}
          user={currentUser}
          onCreated={addTicket}
        />
        <StaffDialog
          open={isStaffDialogOpen}
          onOpenChange={setIsStaffDialogOpen}
          roles={roles}
          onCreated={addStaffUser}
        />
        <TicketDrawer
          ticket={selectedTicket}
          user={currentUser}
          users={users}
          comments={selectedComments}
          attachments={selectedAttachments}
          onClose={() => setSelectedTicketId(null)}
          onSave={saveTicket}
          onCancel={cancelTicket}
          onCloseTicket={closeTicket}
          onAddComment={addComment}
          onReply={replyToRequester}
        />
      </div>
    </div>
  );
}
