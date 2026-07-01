import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DashboardHeader } from "./components/DashboardHeader";
import { NewTicketDialog } from "./components/NewTicketDialog";
import { StaffDialog } from "./components/StaffDialog";
import { StatusFilterSection, type StatusFilterItem } from "./components/StatusFilterSection";
import { TicketDrawer } from "./components/TicketDrawer";
import { TicketTableSection } from "./components/TicketTableSection";
import { TicketToolbar } from "./components/TicketToolbar";
import type { AuthSession } from "@/lib/auth-service";
import {
  overviewService,
  type OverviewTimeFrame,
  type TicketOverview,
} from "@/lib/overview-service";
import { priorityService } from "@/lib/priority-service";
import {
  ticketService,
  type CreateTicketWithAttachmentsRequest,
  type TicketSearchResponse,
} from "@/lib/ticket-service";
import { userService, type CreateUserRequest } from "@/lib/user-service";
import {
  staticAttachments,
  staticComments,
  staticRoles,
  staticStatuses,
  staticTickets,
  staticUsers,
  type LookupItem,
  type Ticket,
  type TicketAttachment,
  type TicketComment,
  type UserLookupItem,
} from "./dashboard-data";
import { ALL_PRIORITIES, ALL_USERS, useDebouncedValue } from "./dashboard-utils";

interface DashboardPageProps {
  session: AuthSession;
  onLogout: () => void;
}

export function DashboardPage({ session, onLogout }: DashboardPageProps) {
  const currentUser = {
    id: session.userId,
    name: session.name,
    email: session.email,
    role: session.role,
  };
  const [tickets, setTickets] = useState<Ticket[]>(staticTickets);
  const [users, setUsers] = useState<UserLookupItem[]>(staticUsers);
  const [priorities, setPriorities] = useState<LookupItem[]>([]);
  const [comments, setComments] = useState<TicketComment[]>(staticComments);
  const [attachments, setAttachments] = useState<TicketAttachment[]>(staticAttachments);
  const [priorityFilter, setPriorityFilter] = useState(ALL_PRIORITIES);
  const [userFilter, setUserFilter] = useState(ALL_USERS);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [ticketSearch, setTicketSearch] = useState<TicketSearchResponse | null>(null);
  const [overviewTimeFrame, setOverviewTimeFrame] = useState<OverviewTimeFrame>("all");
  const [ticketOverview, setTicketOverview] = useState<TicketOverview | null>(null);
  const [isTicketsLoading, setIsTicketsLoading] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [isStaffDialogOpen, setIsStaffDialogOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search);
  const isAdmin = currentUser.role === "admin";
  const priorityId = priorityFilter === ALL_PRIORITIES ? undefined : Number(priorityFilter);
  const userId = userFilter === ALL_USERS ? undefined : Number(userFilter);
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

    return staticStatuses.map((status) => ({ ...status, count: 0 }));
  }, [ticketOverview]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, priorityFilter, userFilter]);

  useEffect(() => {
    let ignore = false;

    Promise.allSettled([userService.getUsers(), priorityService.getPriorities()]).then(
      ([usersResult, prioritiesResult]) => {
        if (ignore) return;

        if (usersResult.status === "fulfilled") {
          setUsers(usersResult.value);
        } else {
          setUsers([]);
          toast.error("Failed to load users");
        }

        if (prioritiesResult.status === "fulfilled") {
          setPriorities(prioritiesResult.value);
        } else {
          setPriorities([]);
          toast.error("Failed to load priorities");
        }
      },
    );

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    overviewService
      .getTicketOverview({
        timeFrame: overviewTimeFrame,
        userId: overviewUserId,
      })
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
  }, [overviewTimeFrame, overviewUserId]);

  useEffect(() => {
    let ignore = false;

    setIsTicketsLoading(true);
    ticketService
      .getTickets({
        page,
        priorityId,
        userId: ticketUserId,
        search: debouncedSearch.trim() || undefined,
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
  }, [debouncedSearch, page, priorityId, ticketUserId]);

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
        status:
          staticStatuses.find((status) => status.id === createdTicket.statusId)?.name ?? "N/A",
        priorityId: createdTicket.priorityId,
        priority: null,
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
  };

  const addStaffUser = async (request: CreateUserRequest) => {
    await userService.createUser(request);
    const refreshedUsers = await userService.getUsers();
    setUsers(refreshedUsers);
  };

  const saveTicket = async (updatedTicket: Ticket) => {
    await ticketService.updateTicket(updatedTicket.id, {
      title: updatedTicket.title,
      body: updatedTicket.body,
      statusId: updatedTicket.statusId,
      priorityId: updatedTicket.priorityId,
      ...(isAdmin ? { userId: updatedTicket.userId ?? null } : { actorUserId: currentUser.id }),
    });

    setTickets((current) =>
      current.map((ticket) => (ticket.id === updatedTicket.id ? updatedTicket : ticket)),
    );
  };

  const deleteTicket = async (ticketId: number) => {
    await ticketService.deleteTicket(ticketId);
    setTickets((current) => current.filter((ticket) => ticket.id !== ticketId));
    setComments((current) => current.filter((comment) => comment.ticketId !== ticketId));
    setAttachments((current) => current.filter((attachment) => attachment.ticketId !== ticketId));
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
    <div className="relative min-h-screen overflow-hidden bg-[#f8f8f6]">
      <div className="pointer-events-none absolute inset-0 opacity-[0.36] [background-image:linear-gradient(to_right,rgba(18,18,18,.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(18,18,18,.06)_1px,transparent_1px)] [background-size:54px_54px]" />
      <div className="relative min-h-screen">
        <DashboardHeader
          isAdmin={isAdmin}
          user={currentUser}
          onAddStaff={() => setIsStaffDialogOpen(true)}
          onNewTicket={() => setIsNewTicketOpen(true)}
          onLogout={onLogout}
        />

        <main className="w-full space-y-5 px-4 py-5 lg:px-6">
          <StatusFilterSection
            statusFilters={statusFilters}
            totalCount={ticketOverview?.totalCount ?? 0}
            timeFrame={overviewTimeFrame}
            onTimeFrameChange={setOverviewTimeFrame}
          />
          <TicketToolbar
            search={search}
            priorityFilter={priorityFilter}
            userFilter={userFilter}
            showUserFilter={isAdmin}
            priorities={priorities}
            users={users}
            onSearchChange={setSearch}
            onPriorityChange={setPriorityFilter}
            onUserChange={setUserFilter}
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
          roles={staticRoles}
          onCreated={addStaffUser}
        />
        <TicketDrawer
          ticket={selectedTicket}
          user={currentUser}
          statuses={staticStatuses}
          priorities={priorities}
          users={users}
          comments={selectedComments}
          attachments={selectedAttachments}
          onClose={() => setSelectedTicketId(null)}
          onSave={saveTicket}
          onDelete={deleteTicket}
          onAddComment={addComment}
          onReply={replyToRequester}
        />
      </div>
    </div>
  );
}
