import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { useDetailedTicketQueries } from "@/queries/detailed-ticket.queries";
import type {
  DetailedTicketContentProps,
  DetailedTicketPageProps,
  TicketAttachment,
} from "@/models";
import { CloseTicketDialog } from "./components/close-ticket/CloseTicketDialog";
import { DetailedTicketContent } from "./components/DetailedTicketContent";

export function DetailedTicketPage({ ticketId, session, onBack }: DetailedTicketPageProps) {
  const user = useMemo(
    () => ({
      id: session.userId,
      name: session.name,
      email: session.email,
      role: session.role,
    }),
    [session.email, session.name, session.role, session.userId],
  );

  const {
    ticket,
    users,
    comments,
    attachments,
    error,
    isTicketLoading,
    isCommentsLoading,
    isAttachmentsLoading,
    isAssigning,
    isCancelling,
    isClosing,
    isSendingMessage,
    isSendingReply,
    downloadingAttachmentId,
    assignTicket,
    cancelTicket,
    closeTicket,
    addComment,
    replyToRequester,
    downloadAttachment,
  } = useDetailedTicketQueries({ ticketId, currentUser: user });

  const [draftUserId, setDraftUserId] = useState("");
  const [message, setMessage] = useState("");
  const [closingMessage, setClosingMessage] = useState("");
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [isAttachmentsOpen, setIsAttachmentsOpen] = useState(false);

  useEffect(() => {
    setDraftUserId(ticket?.userId != null ? String(ticket.userId) : "");
  }, [ticket?.id, ticket?.userId]);

  if (!ticket) {
    if (isTicketLoading) {
      return (
        <main className="flex h-screen w-full flex-col overflow-hidden bg-background">
          <div className="shrink-0 border-b border-[#dfe5ec] bg-surface px-4 py-3 lg:px-6">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-3 h-7 w-2/3" />
          </div>
          <div className="grid min-h-0 flex-1 gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <Skeleton className="rounded-card" />
            <Skeleton className="rounded-card" />
          </div>
        </main>
      );
    }

    return (
      <main className="flex h-screen w-full items-center justify-center bg-background px-4 py-6">
        <EmptyState
          icon={<FileQuestion />}
          title="Ticket not found"
          description={
            error instanceof Error
              ? error.message
              : "This ticket may have been removed, or the link is incorrect."
          }
          action={
            <Button type="button" onClick={onBack} className="mt-2">
              <ArrowLeft className="h-4 w-4" />
              Back to tickets
            </Button>
          }
        />
      </main>
    );
  }

  const normalizedStatus = ticket.status.toLowerCase().replace(/\s+/g, " ").trim();
  const isClosed = normalizedStatus === "closed";
  const isCancelled = normalizedStatus === "cancelled" || normalizedStatus === "canceled";
  const isTerminal = isClosed || isCancelled;

  const assignSelectedTicket = async (nextUserId: string) => {
    const previousUserId = draftUserId;
    const assignedUserId = Number(nextUserId);
    const selectedUser = users.find((staffUser) => staffUser.id === assignedUserId);

    if (!selectedUser || isAssigning) return;

    setDraftUserId(nextUserId);

    try {
      await assignTicket({ ...ticket, userId: assignedUserId, assignee: selectedUser.name });
      toast.success(`Ticket assigned to ${selectedUser.name}`);
    } catch {
      setDraftUserId(previousUserId);
      toast.error("Failed to assign ticket");
    }
  };

  const addConversationMessage = async () => {
    const body = message.trim();
    if (!body) return;

    try {
      await addComment({
        ticketId: ticket.id,
        userId: user.id,
        body,
        authorName: user.name,
        authorEmail: user.email,
        authorType: "Agent",
        isInternalNote: true,
      });
      setMessage("");
      toast.success("Internal note added");
    } catch {
      toast.error("Failed to add message");
    }
  };

  const sendEmailReply = async () => {
    const body = message.trim();
    if (!body) return;

    try {
      await replyToRequester({
        ticketId: ticket.id,
        userId: user.role === "admin" ? null : user.id,
        body,
        authorName: user.name,
        authorEmail: user.email,
        authorType: "Agent",
      });
      setMessage("");
      toast.success("Reply sent");
    } catch {
      toast.error("Failed to send reply");
    }
  };

  const cancelSelectedTicket = async () => {
    if (user.role !== "admin") return;

    try {
      await cancelTicket();
      toast.success("Ticket cancelled");
      onBack();
    } catch {
      toast.error("Failed to cancel ticket");
    }
  };

  const closeSelectedTicket = async () => {
    try {
      await closeTicket(closingMessage.trim());
      toast.success("Ticket closed");
      setIsCloseDialogOpen(false);
      onBack();
    } catch {
      toast.error("Failed to close ticket");
    }
  };

  const downloadSelectedAttachment = async (attachment: TicketAttachment) => {
    try {
      await downloadAttachment(attachment);
    } catch (downloadError) {
      toast.error(
        downloadError instanceof Error ? downloadError.message : "Failed to download attachment",
      );
    }
  };

  const contentProps: DetailedTicketContentProps = {
    ticket,
    user,
    users,
    comments,
    attachments,
    message,
    draftUserId,
    downloadingAttachmentId,
    isCommentsLoading,
    isAttachmentsLoading,
    isAttachmentsOpen,
    isAssigning,
    isSendingMessage,
    isSendingReply,
    isCancelling,
    isClosing,
    isTerminal,
    onMessageChange: setMessage,
    onAssign: (userId) => void assignSelectedTicket(userId),
    onToggleAttachments: () => setIsAttachmentsOpen((open) => !open),
    onDownloadAttachment: (attachment) => void downloadSelectedAttachment(attachment),
    onAddInternalNote: () => void addConversationMessage(),
    onSendReply: () => void sendEmailReply(),
    onOpenCloseDialog: () => setIsCloseDialogOpen(true),
    onCancelTicket: () => void cancelSelectedTicket(),
  };

  return (
    <main className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <header className="shrink-0 border-b border-[#dfe5ec] bg-surface px-4 py-3 lg:px-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex cursor-pointer items-center gap-2 rounded-[4px] text-[11px] font-semibold text-[#526981] transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to tickets
        </button>

        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-brand">
              Ticket TK-{ticket.id}
            </p>
            <h1 className="mt-1 text-[22px] font-semibold leading-7 tracking-[-0.02em] text-[#0f2342]">
              {ticket.title}
            </h1>
          </div>
          <StatusBadge status={ticket.status} />
        </div>
      </header>

      <div className="min-h-0 flex-1">
        <DetailedTicketContent {...contentProps} />
      </div>

      <CloseTicketDialog
        ticketId={ticket.id}
        open={isCloseDialogOpen}
        message={closingMessage}
        isClosing={isClosing}
        onOpenChange={setIsCloseDialogOpen}
        onMessageChange={setClosingMessage}
        onConfirm={() => void closeSelectedTicket()}
      />
    </main>
  );
}
