import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { queryKeys } from "./query-keys";
import type { Ticket, TicketAttachment, TicketComment } from "@/models/ticket";
import {
  ticketService,
  type CloseTicketRequest,
  type CreateTicketCommentRequest,
  type CreateTicketReplyRequest,
  type TicketQuery,
  type TicketSearchResponse,
  type UpdateTicketRequest,
} from "@/services/ticket.service";

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
  });
}

export function useTicketCommentsQuery(ticketId: number | null, fallback: TicketComment[]) {
  return useQuery({
    queryKey: queryKeys.tickets.comments(ticketId ?? 0),
    queryFn: () => ticketService.getComments(ticketId!),
    enabled: ticketId !== null,
    placeholderData: fallback,
    staleTime: 60 * 1000,
  });
}

export function useTicketAttachmentsQuery(ticketId: number | null, fallback: TicketAttachment[]) {
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
    mutationFn: ({ ticketId, request }: { ticketId: number; request: UpdateTicketRequest }) =>
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
    mutationFn: ({ ticketId, request }: { ticketId: number; request: CloseTicketRequest }) =>
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
    mutationFn: ({
      ticketId,
      request,
    }: {
      ticketId: number;
      request: CreateTicketCommentRequest;
    }) => ticketService.addComment(ticketId, request),
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
    mutationFn: ({ ticketId, request }: { ticketId: number; request: CreateTicketReplyRequest }) =>
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
