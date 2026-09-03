import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { queryKeys } from "./query-keys";
import { ticketService } from "@/services/ticket.service";
import type {
  AddTicketCommentVariables,
  CloseTicketVariables,
  ReplyToRequesterVariables,
  Ticket,
  TicketAttachment,
  TicketComment,
  TicketQuery,
  TicketSearchResponse,
  UpdateTicketVariables,
} from "@/models";

function updateTicketInCachedLists(queryClient: QueryClient, updatedTicket: Ticket) {
  queryClient.setQueriesData<TicketSearchResponse>(
    { queryKey: queryKeys.tickets.lists() },
    (current) =>
      current
        ? {
            ...current,
            items: current.items.map((ticket) =>
              ticket.id === updatedTicket.id ? updatedTicket : ticket,
            ),
          }
        : current,
  );
  queryClient.setQueryData(queryKeys.tickets.detail(updatedTicket.id), updatedTicket);
}

function markRequesterRepliesAsReadInCachedLists(queryClient: QueryClient, ticketId: number) {
  queryClient.setQueriesData<TicketSearchResponse>(
    { queryKey: queryKeys.tickets.lists() },
    (current) =>
      current
        ? {
            ...current,
            items: current.items.map((ticket) =>
              ticket.id === ticketId
                ? {
                    ...ticket,
                    hasUnreadRequesterReply: false,
                    unreadRequesterReplyCount: 0,
                  }
                : ticket,
            ),
          }
        : current,
  );
  queryClient.setQueryData<Ticket>(queryKeys.tickets.detail(ticketId), (current) =>
    current
      ? {
          ...current,
          hasUnreadRequesterReply: false,
          unreadRequesterReplyCount: 0,
        }
      : current,
  );
}

function invalidateTicketListsAndOverview(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.tickets.lists() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.overview.all }),
  ]);
}

export function useTicketsQuery(query: TicketQuery, fallback: TicketSearchResponse) {
  return useQuery({
    queryKey: queryKeys.tickets.list(query),
    queryFn: () => ticketService.getTickets(query),
    placeholderData: (previousData) => previousData ?? fallback,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useTicketQuery(ticketId: number) {
  return useQuery({
    queryKey: queryKeys.tickets.detail(ticketId),
    queryFn: () => ticketService.getTicket(ticketId),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useTicketCommentsQuery(ticketId: number | null, fallback: TicketComment[] = []) {
  return useQuery({
    queryKey: queryKeys.tickets.comments(ticketId ?? 0),
    queryFn: () => ticketService.getComments(ticketId!),
    enabled: ticketId !== null,
    placeholderData: fallback,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchInterval: ticketId !== null ? 30 * 1000 : false,
    refetchOnWindowFocus: true,
  });
}

export function useTicketAttachmentsQuery(
  ticketId: number | null,
  fallback: TicketAttachment[] = [],
) {
  return useQuery({
    queryKey: queryKeys.tickets.attachments(ticketId ?? 0),
    queryFn: () => ticketService.getAttachments(ticketId!),
    enabled: ticketId !== null,
    placeholderData: fallback,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateTicketMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ticketService.createTicketWithAttachments,
    onSuccess: () => invalidateTicketListsAndOverview(queryClient),
  });
}

export function useUpdateTicketMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, request }: UpdateTicketVariables) =>
      ticketService.updateTicket(ticketId, request),
    onSuccess: (ticket) => {
      updateTicketInCachedLists(queryClient, ticket);
      return invalidateTicketListsAndOverview(queryClient);
    },
  });
}

export function useCancelTicketMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ticketService.cancelTicket,
    onSuccess: (ticket) => {
      updateTicketInCachedLists(queryClient, ticket);
      return invalidateTicketListsAndOverview(queryClient);
    },
  });
}

export function useCloseTicketMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, request }: CloseTicketVariables) =>
      ticketService.closeTicket(ticketId, request),
    onSuccess: (ticket) => {
      updateTicketInCachedLists(queryClient, ticket);
      return Promise.all([
        invalidateTicketListsAndOverview(queryClient),
        queryClient.invalidateQueries({ queryKey: queryKeys.tickets.comments(ticket.id) }),
      ]);
    },
  });
}

export function useAddTicketCommentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, request }: AddTicketCommentVariables) =>
      ticketService.addComment(ticketId, request),
    onSuccess: (comment) => {
      queryClient.setQueryData<TicketComment[]>(
        queryKeys.tickets.comments(comment.ticketId),
        (current = []) => [...current, comment],
      );
      return queryClient.invalidateQueries({ queryKey: queryKeys.tickets.lists() });
    },
  });
}

export function useReplyToRequesterMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, request }: ReplyToRequesterVariables) =>
      ticketService.replyToRequester(ticketId, request),
    onSuccess: (comment) => {
      queryClient.setQueryData<TicketComment[]>(
        queryKeys.tickets.comments(comment.ticketId),
        (current = []) => [...current, comment],
      );
      return queryClient.invalidateQueries({ queryKey: queryKeys.tickets.lists() });
    },
  });
}

export function useMarkRequesterRepliesAsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ticketService.markRequesterRepliesAsRead,
    onSuccess: (_, ticketId) => {
      markRequesterRepliesAsReadInCachedLists(queryClient, ticketId);
    },
  });
}

export function useDownloadTicketAttachmentMutation() {
  return useMutation({
    mutationFn: async (attachment: TicketAttachment) => ({
      attachment,
      blob: await ticketService.downloadAttachment(attachment),
    }),
    onSuccess: ({ attachment, blob }) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = attachment.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
  });
}
