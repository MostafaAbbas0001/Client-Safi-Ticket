import { useMemo } from "react";
import { useTicketOverviewQuery } from "./overview.queries";
import { useRolesQuery } from "./role.queries";
import { useStatusesQuery } from "./status.queries";
import {
  useAddTicketCommentMutation,
  useCancelTicketMutation,
  useCloseTicketMutation,
  useCreateTicketMutation,
  useDownloadTicketAttachmentMutation,
  useReplyToRequesterMutation,
  useTicketAttachmentsQuery,
  useTicketCommentsQuery,
  useTicketsQuery,
  useUpdateTicketMutation,
} from "./ticket.queries";
import { useCreateUserMutation, useUsersQuery } from "./user.queries";
import {
  staticAttachments,
  staticComments,
  staticStatuses,
  staticTickets,
  staticUsers,
} from "@/data/dashboard-fallbacks";
import type { Ticket, TicketAttachment, TicketComment, User } from "@/models/ticket";
import type { CreateTicketWithAttachmentsRequest } from "@/services/ticket.service";
import type { CreateUserRequest } from "@/services/user.service";

interface DashboardQueryOptions {
  currentUser: User;
  page: number;
  userId?: number;
  statusIds?: number[];
  search?: string;
  startDate: string;
  endDate: string;
  selectedTicketId: number | null;
}

export function useDashboardQueries({
  currentUser,
  page,
  userId,
  statusIds,
  search,
  startDate,
  endDate,
  selectedTicketId,
}: DashboardQueryOptions) {
  const isAdmin = currentUser.role === "admin";
  const ticketQuery = {
    page,
    userId: isAdmin ? userId : currentUser.id,
    statusIds,
    search,
    startDate,
    endDate,
  };
  const overviewQuery = {
    startDate,
    endDate,
    userId: isAdmin ? undefined : currentUser.id,
  };
  const fallbackTicketSearch = useMemo(
    () => ({ items: staticTickets, page: 1, pageSize: 50, totalCount: staticTickets.length }),
    [],
  );
  const fallbackComments = staticComments.filter(
    (comment) => comment.ticketId === selectedTicketId,
  );
  const fallbackAttachments = staticAttachments.filter(
    (attachment) => attachment.ticketId === selectedTicketId,
  );

  const ticketsQuery = useTicketsQuery(ticketQuery, fallbackTicketSearch);
  const overviewResult = useTicketOverviewQuery(overviewQuery);
  const usersResult = useUsersQuery();
  const statusesResult = useStatusesQuery();
  const rolesResult = useRolesQuery(isAdmin);
  const commentsResult = useTicketCommentsQuery(selectedTicketId, fallbackComments);
  const attachmentsResult = useTicketAttachmentsQuery(selectedTicketId, fallbackAttachments);
  const createTicketMutation = useCreateTicketMutation();
  const createUserMutation = useCreateUserMutation();
  const updateTicketMutation = useUpdateTicketMutation();
  const cancelTicketMutation = useCancelTicketMutation();
  const closeTicketMutation = useCloseTicketMutation();
  const addCommentMutation = useAddTicketCommentMutation();
  const replyMutation = useReplyToRequesterMutation();
  const downloadAttachmentMutation = useDownloadTicketAttachmentMutation();

  const addTicket = async (request: CreateTicketWithAttachmentsRequest) => {
    await createTicketMutation.mutateAsync(request);
  };

  const addStaffUser = async (request: CreateUserRequest) => {
    await createUserMutation.mutateAsync(request);
  };

  const assignTicket = async (ticket: Ticket) => {
    await updateTicketMutation.mutateAsync({
      ticketId: ticket.id,
      request: {
        title: ticket.title,
        body: ticket.body,
        ...(isAdmin && ticket.userId ? { userId: ticket.userId } : {}),
      },
    });
  };

  const cancelTicket = async (ticketId: number) => {
    await cancelTicketMutation.mutateAsync(ticketId);
  };

  const closeTicket = async (ticketId: number, body: string) => {
    await closeTicketMutation.mutateAsync({
      ticketId,
      request: {
        body,
        authorName: currentUser.name,
        authorEmail: currentUser.email,
        userId: isAdmin ? null : currentUser.id,
      },
    });
  };

  const addComment = async (comment: Omit<TicketComment, "id" | "createdAt">) => {
    await addCommentMutation.mutateAsync({
      ticketId: comment.ticketId,
      request: {
        body: comment.body,
        authorName: comment.authorName,
        authorEmail: comment.authorEmail,
        authorType: comment.authorType,
        isInternalNote: comment.isInternalNote,
        userId: comment.userId,
      },
    });
  };

  const replyToRequester = async (
    reply: Omit<TicketComment, "id" | "createdAt" | "isInternalNote">,
  ) => {
    await replyMutation.mutateAsync({
      ticketId: reply.ticketId,
      request: {
        body: reply.body,
        authorName: reply.authorName,
        authorEmail: reply.authorEmail,
        userId: reply.userId,
      },
    });
  };

  const downloadAttachment = async (attachment: TicketAttachment) => {
    await downloadAttachmentMutation.mutateAsync(attachment);
  };

  /*
   * These queries all seed themselves with placeholder data, so `isLoading` is
   * false from the first render and cannot tell "showing placeholders" apart
   * from "showing real rows". `dataUpdatedAt` only moves once a fetch actually
   * resolves, which is exactly the distinction the UI needs: skeletons before
   * the first real payload, a subtler refreshing treatment after it.
   */
  const hasLoadedTickets = ticketsQuery.dataUpdatedAt > 0;
  const hasLoadedOverview = overviewResult.dataUpdatedAt > 0;
  const hasLoadedComments = commentsResult.dataUpdatedAt > 0;
  const hasLoadedAttachments = attachmentsResult.dataUpdatedAt > 0;

  return {
    tickets: ticketsQuery.data?.items ?? staticTickets,
    ticketSearch: ticketsQuery.data,
    ticketOverview: overviewResult.data ?? null,
    users: usersResult.data ?? staticUsers,
    statuses: statusesResult.data ?? staticStatuses,
    roles: isAdmin ? (rolesResult.data ?? []) : [],
    comments: commentsResult.data ?? fallbackComments,
    attachments: attachmentsResult.data ?? fallbackAttachments,
    isTicketsLoading: !hasLoadedTickets,
    isTicketsRefreshing: hasLoadedTickets && ticketsQuery.isFetching,
    isOverviewLoading: !hasLoadedOverview,
    isOverviewRefreshing: hasLoadedOverview && overviewResult.isFetching,
    isCommentsLoading: selectedTicketId !== null && !hasLoadedComments,
    isAttachmentsLoading: selectedTicketId !== null && !hasLoadedAttachments,
    addTicket,
    addStaffUser,
    assignTicket,
    cancelTicket,
    closeTicket,
    addComment,
    replyToRequester,
    downloadAttachment,
  };
}
