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

const EMPTY_DAILY_TICKETS: TicketOverview["dailyTickets"] = [];
const STATIC_STATUSES: LookupItem[] = [
  { id: 1, name: "Initiated" },
  { id: 2, name: "In Progress" },
  { id: 3, name: "Closed" },
  { id: 4, name: "Cancelled" },
];

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
  const [statuses, setStatuses] = useState<LookupItem[]>(STATIC_STATUSES);
  const [roles, setRoles] = useState<LookupItem[]>([]);
  const [users, setUsers] = useState<UserLookupItem[]>(staticUsers);
  const [comments, setComments] = useState<TicketComment[]>(staticComments);
  const [attachments, setAttachments] = useState<TicketAttachment[]>(staticAttachments);
  const [userFilter, setUserFilter] = useState(ALL_USERS);
  const [search, setSearch] = useState("");
  const [statusFilterIds, setStatusFilterIds] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [ticketSearch, setTicketSearch] = useState<TicketSearchResponse | null>(null);
  const [overviewDateRange, setOverviewDateRange] = useState(getCurrentWeekRange);
  const [ticketOverview, setTicketOverview] = useState<TicketOverview | null>(null);
  const [isTicketsLoading, setIsTicketsLoading] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [isStaffDialogOpen, setIsStaffDialogOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search);
  const isAdmin = currentUser.role === "admin";
  const userId = userFilter === ALL_USERS ? undefined : Number(userFilter);
  const statusIds = statusFilterIds.length > 0 ? statusFilterIds : undefined;
  const ticketUserId = isAdmin ? userId : currentUser.id;
  const overviewUserId = isAdmin ? undefined : currentUser.id;
  const dailyTickets = ticketOverview?.dailyTickets ?? EMPTY_DAILY_TICKETS;
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

    const fallbackCounts: Record<string, number> = {
      Initiated: 2,
      "In Progress": 2,
      Closed: 19,
      Cancelled: 0,
    };

    return statuses.map((status) => ({ ...status, count: fallbackCounts[status.name] ?? 0 }));
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
    statusFilterIds,
  ]);

  useEffect(() => {
    let ignore = false;

    Promise.allSettled([userService.getUsers(), statusService.getStatuses()]).then(
      ([usersResult, statusesResult]) => {
        if (ignore) return;

        if (usersResult.status === "fulfilled") {
          setUsers(usersResult.value);
        } else {
          setUsers(staticUsers);
        }

        if (statusesResult.status === "fulfilled") {
          setStatuses(statusesResult.value);
        } else {
          setStatuses(STATIC_STATUSES);
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
        statusIds,
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
        // Keep the high-fidelity local queue available when the API is offline.
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
    statusIds,
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
        // Preserve the local conversation fallback.
      }

      if (attachmentsResult.status === "fulfilled") {
        setAttachments((current) => [
          ...current.filter((attachment) => attachment.ticketId !== selectedTicketId),
          ...attachmentsResult.value,
        ]);
      } else {
        // Preserve the local attachment fallback.
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

  const assignTicket = async (updatedTicket: Ticket) => {
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
          isSidebarCollapsed={isSidebarCollapsed}
          user={currentUser}
          onAddStaff={() => setIsStaffDialogOpen(true)}
          onNewTicket={() => setIsNewTicketOpen(true)}
          onLogout={onLogout}
          onToggleSidebar={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
        />

        <div
          className={`flex min-h-[calc(100vh-64px)] transition-[margin] duration-200 lg:min-h-screen ${
            isSidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-[212px]"
          }`}
        >
          <main className="min-w-0 flex-1 px-4 py-4 lg:px-5">
            <div className={selectedTicket ? "lg:hidden" : undefined}>
              <StatusFilterSection
                statusFilters={statusFilters}
                dailyTickets={dailyTickets}
                totalCount={ticketOverview?.totalCount ?? 0}
                search={search}
                userFilter={userFilter}
                statusFilterIds={statusFilterIds}
                showUserFilter={isAdmin}
                users={users}
                statuses={statuses}
                startDate={overviewDateRange.startDate}
                endDate={overviewDateRange.endDate}
                onSearchChange={setSearch}
                onUserChange={setUserFilter}
                onStatusChange={setStatusFilterIds}
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
            </div>

            <TicketDrawer
              ticket={selectedTicket}
              user={currentUser}
              users={users}
              comments={selectedComments}
              attachments={selectedAttachments}
              onClose={() => setSelectedTicketId(null)}
              onAssign={assignTicket}
              onCancel={cancelTicket}
              onCloseTicket={closeTicket}
              onAddComment={addComment}
              onReply={replyToRequester}
            />
          </main>
        </div>

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
      </div>
    </div>
  );
}
