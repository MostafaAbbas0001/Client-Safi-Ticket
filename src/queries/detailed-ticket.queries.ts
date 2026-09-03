import { useEffect, useRef } from "react";
import {
  useAddTicketCommentMutation,
  useCancelTicketMutation,
  useCloseTicketMutation,
  useDownloadTicketAttachmentMutation,
  useMarkRequesterRepliesAsReadMutation,
  useReplyToRequesterMutation,
  useTicketAttachmentsQuery,
  useTicketCommentsQuery,
  useTicketQuery,
  useUpdateTicketMutation,
} from "./ticket.queries";
import { useUsersQuery } from "./user.queries";
import type { DetailedTicketQueryOptions, Ticket, TicketAttachment, TicketComment } from "@/models";

export function useDetailedTicketQueries({ ticketId, currentUser }: DetailedTicketQueryOptions) {
  const ticketQuery = useTicketQuery(ticketId);
  const commentsQuery = useTicketCommentsQuery(ticketId);
  const attachmentsQuery = useTicketAttachmentsQuery(ticketId);
  const usersQuery = useUsersQuery();
  const updateTicketMutation = useUpdateTicketMutation();
  const cancelTicketMutation = useCancelTicketMutation();
  const closeTicketMutation = useCloseTicketMutation();
  const addCommentMutation = useAddTicketCommentMutation();
  const replyMutation = useReplyToRequesterMutation();
  const downloadAttachmentMutation = useDownloadTicketAttachmentMutation();
  const markReadMutation = useMarkRequesterRepliesAsReadMutation();
  const activeUnreadReplyKeyRef = useRef<string | null>(null);
  const ticket = ticketQuery.data;
  const unreadReplyKey = ticket?.hasUnreadRequesterReply
    ? [ticket.id, ticket.unreadRequesterReplyCount ?? 1, ticket.lastRequesterReplyAt ?? ""].join(
        ":",
      )
    : null;
  const refetchComments = commentsQuery.refetch;
  const markRequesterRepliesAsRead = markReadMutation.mutate;

  useEffect(() => {
    if (unreadReplyKey === null) {
      activeUnreadReplyKeyRef.current = null;
      return;
    }

    if (activeUnreadReplyKeyRef.current === unreadReplyKey) return;

    activeUnreadReplyKeyRef.current = unreadReplyKey;

    void refetchComments().then((result) => {
      if (activeUnreadReplyKeyRef.current !== unreadReplyKey) return;

      if (!result.isSuccess) {
        activeUnreadReplyKeyRef.current = null;
        return;
      }

      markRequesterRepliesAsRead(ticketId, {
        onError: () => {
          if (activeUnreadReplyKeyRef.current === unreadReplyKey) {
            activeUnreadReplyKeyRef.current = null;
          }
        },
      });
    });
  }, [markRequesterRepliesAsRead, refetchComments, ticketId, unreadReplyKey]);

  const assignTicket = async (updatedTicket: Ticket) => {
    await updateTicketMutation.mutateAsync({
      ticketId: updatedTicket.id,
      request: {
        title: updatedTicket.title,
        body: updatedTicket.body,
        ...(currentUser.role === "admin" && updatedTicket.userId
          ? { userId: updatedTicket.userId }
          : {}),
      },
    });
  };

  const cancelTicket = async () => {
    await cancelTicketMutation.mutateAsync(ticketId);
  };

  const closeTicket = async (body: string) => {
    await closeTicketMutation.mutateAsync({
      ticketId,
      request: {
        body,
        authorName: currentUser.name,
        authorEmail: currentUser.email,
        userId: currentUser.role === "admin" ? null : currentUser.id,
      },
    });
  };

  const addComment = async (comment: Omit<TicketComment, "id" | "createdAt">) => {
    await addCommentMutation.mutateAsync({
      ticketId,
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
      ticketId,
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

  return {
    ticket,
    users: usersQuery.data ?? [],
    comments: commentsQuery.data ?? [],
    attachments: attachmentsQuery.data ?? [],
    error: ticketQuery.error,
    isTicketLoading: ticketQuery.dataUpdatedAt === 0 && ticketQuery.isPending,
    isCommentsLoading: commentsQuery.dataUpdatedAt === 0 && commentsQuery.isPending,
    isAttachmentsLoading: attachmentsQuery.dataUpdatedAt === 0 && attachmentsQuery.isPending,
    isAssigning: updateTicketMutation.isPending,
    isCancelling: cancelTicketMutation.isPending,
    isClosing: closeTicketMutation.isPending,
    isSendingMessage: addCommentMutation.isPending,
    isSendingReply: replyMutation.isPending,
    downloadingAttachmentId: downloadAttachmentMutation.isPending
      ? (downloadAttachmentMutation.variables?.id ?? null)
      : null,
    assignTicket,
    cancelTicket,
    closeTicket,
    addComment,
    replyToRequester,
    downloadAttachment,
  };
}
