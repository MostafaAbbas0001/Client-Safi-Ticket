import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  CircleCheckBig,
  CircleX,
  ChevronDown,
  ContactRound,
  Download,
  LockKeyhole,
  MessageSquareText,
  MessagesSquare,
  Paperclip,
  SendHorizontal,
  UserRoundCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type {
  Ticket,
  TicketAttachment,
  TicketComment,
  User,
  UserLookupItem,
} from "@/models/ticket";
import { formatAttachmentSize, formatDate } from "../dashboard-utils";
import { EmailBody } from "./EmailBody";
import { StatusBadge } from "./TicketBadges";

interface TicketDrawerProps {
  ticket: Ticket | null;
  user: User;
  users: UserLookupItem[];
  comments: TicketComment[];
  attachments: TicketAttachment[];
  isCommentsLoading: boolean;
  isAttachmentsLoading: boolean;
  onClose: () => void;
  onAssign: (ticket: Ticket) => Promise<void>;
  onCancel: (ticketId: number) => Promise<void>;
  onCloseTicket: (ticketId: number, body: string) => Promise<void>;
  onAddComment: (comment: Omit<TicketComment, "id" | "createdAt">) => Promise<void>;
  onReply: (reply: Omit<TicketComment, "id" | "createdAt" | "isInternalNote">) => Promise<void>;
  onDownloadAttachment: (attachment: TicketAttachment) => Promise<void>;
}

function DetailItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="min-w-0 border-l border-[#dfe5ec] pl-3">
      <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[.06em] text-[#718198]">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-2 break-words text-[11px] font-medium leading-4 text-[#102445]">
        {value}
      </div>
    </div>
  );
}

/** Placeholder that matches a comment card's shape while replies load. */
function CommentSkeleton() {
  return (
    <div className="my-2 rounded-[6px] border border-[#dfe5ec] border-l-[3px] border-l-line px-3 py-3">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-4 w-20 rounded-[5px]" />
          </div>
          <Skeleton className="h-2.5 w-36" />
        </div>
        <Skeleton className="h-2.5 w-24" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-2.5 w-full" />
        <Skeleton className="h-2.5 w-[92%]" />
        <Skeleton className="h-2.5 w-[60%]" />
      </div>
    </div>
  );
}

function AttachmentSkeleton() {
  return (
    <ul className="divide-y divide-[#e2e7ee] rounded-field border border-[#dfe5ec]">
      {Array.from({ length: 2 }, (_, index) => (
        <li key={index} className="flex min-h-11 items-center justify-between gap-2 px-3 py-2">
          <Skeleton className="h-2.5 w-[60%]" />
          <Skeleton className="h-3 w-3 rounded-full" />
        </li>
      ))}
    </ul>
  );
}

function getCommentPresentation(comment: TicketComment) {
  if (comment.isInternalNote) {
    return {
      label: "Internal note",
      className: "border-l-amber-500 bg-background",
      badgeClassName: "border-amber-300 bg-amber-50 text-amber-800",
    };
  }

  if (comment.authorType.toLowerCase() === "requester") {
    return {
      label: "Requester email",
      className: "border-l-blue-600 bg-background",
      badgeClassName: "border-blue-300 bg-blue-50 text-blue-800",
    };
  }

  return {
    label: "Email reply",
    className: "border-l-emerald-600 bg-background",
    badgeClassName: "border-emerald-300 bg-emerald-50 text-emerald-800",
  };
}

export function TicketDrawer({
  ticket,
  user,
  users,
  comments,
  attachments,
  isCommentsLoading,
  isAttachmentsLoading,
  onClose,
  onAssign,
  onCancel,
  onCloseTicket,
  onAddComment,
  onReply,
  onDownloadAttachment,
}: TicketDrawerProps) {
  const [draftUserId, setDraftUserId] = useState("");
  const [message, setMessage] = useState("");
  const [closingMessage, setClosingMessage] = useState("");
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [visibleTicket, setVisibleTicket] = useState<Ticket | null>(ticket);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isAttachmentsOpen, setIsAttachmentsOpen] = useState(false);
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<number | null>(null);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia("(min-width: 1024px)").matches,
  );

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    const updateViewport = (event: MediaQueryListEvent) => setIsDesktop(event.matches);

    setIsDesktop(desktopQuery.matches);
    desktopQuery.addEventListener("change", updateViewport);
    return () => desktopQuery.removeEventListener("change", updateViewport);
  }, []);

  useEffect(() => {
    if (ticket) {
      setVisibleTicket(ticket);
    } else {
      const timeout = window.setTimeout(() => setVisibleTicket(null), 300);
      return () => window.clearTimeout(timeout);
    }
  }, [ticket]);

  const activeTicket = ticket ?? visibleTicket;

  useEffect(() => {
    setDraftUserId(activeTicket?.userId != null ? String(activeTicket.userId) : "");
    setMessage("");
    setClosingMessage("");
    setIsAttachmentsOpen(false);
    setIsCloseDialogOpen(false);
  }, [activeTicket?.id, activeTicket?.userId]);

  if (!activeTicket) return null;

  const normalizedStatus = activeTicket.status.toLowerCase().replace(/\s+/g, " ").trim();
  const isClosed = normalizedStatus === "closed";
  const isCancelled = normalizedStatus === "cancelled" || normalizedStatus === "canceled";
  const isTerminal = isClosed || isCancelled;

  const assignTicket = async (nextUserId: string) => {
    const previousUserId = draftUserId;
    const assignedUserId = Number(nextUserId);
    const selectedUser = users.find((staffUser) => staffUser.id === assignedUserId);

    if (!selectedUser || isAssigning) return;

    setDraftUserId(nextUserId);

    try {
      setIsAssigning(true);
      await onAssign({
        ...activeTicket,
        userId: assignedUserId,
        assignee: selectedUser.name,
      });

      toast.success(`Ticket assigned to ${selectedUser.name}`);
    } catch {
      setDraftUserId(previousUserId);
      toast.error("Failed to assign ticket");
    } finally {
      setIsAssigning(false);
    }
  };

  const addConversationMessage = async () => {
    const body = message.trim();
    if (!body) return;

    try {
      setIsSendingMessage(true);
      await onAddComment({
        ticketId: activeTicket.id,
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
    } finally {
      setIsSendingMessage(false);
    }
  };

  const sendEmailReply = async () => {
    const body = message.trim();
    if (!body) return;

    try {
      setIsSendingReply(true);
      await onReply({
        ticketId: activeTicket.id,
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
    } finally {
      setIsSendingReply(false);
    }
  };

  const cancelSelectedTicket = async () => {
    if (user.role !== "admin") return;

    try {
      setIsCancelling(true);
      await onCancel(activeTicket.id);
      toast.success("Ticket cancelled");
      onClose();
    } catch {
      toast.error("Failed to cancel ticket");
    } finally {
      setIsCancelling(false);
    }
  };

  const closeSelectedTicket = async () => {
    const body = closingMessage.trim();

    try {
      setIsClosing(true);
      await onCloseTicket(activeTicket.id, body);
      toast.success("Ticket closed");
      setIsCloseDialogOpen(false);
      onClose();
    } catch {
      toast.error("Failed to close ticket");
    } finally {
      setIsClosing(false);
    }
  };

  const downloadAttachment = async (attachment: TicketAttachment) => {
    if (downloadingAttachmentId !== null) return;

    try {
      setDownloadingAttachmentId(attachment.id);
      await onDownloadAttachment(attachment);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to download attachment");
    } finally {
      setDownloadingAttachmentId(null);
    }
  };

  return (
    <>
      <article className="animate-in fade-in-0 hidden h-[calc(100vh-32px)] w-full flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card duration-300 lg:flex">
        <header className="shrink-0 border-b border-[#dfe5ec] bg-surface px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="mb-3 inline-flex cursor-pointer items-center gap-2 rounded-[4px] text-[11px] font-semibold text-[#526981] transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to tickets
          </button>
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#146ef5]">
                Ticket TK-{activeTicket.id}
              </p>
              <h1 className="mt-1 text-[24px] font-semibold leading-8 tracking-[-0.02em] text-[#0f2342]">
                {activeTicket.title}
              </h1>
              <p className="mt-1 text-[11px] text-[#718198]">
                Opened by {activeTicket.requester} · {formatDate(activeTicket.createdAt)}
              </p>
            </div>
            <StatusBadge status={activeTicket.status} />
          </div>
        </header>

        <div className="grid min-h-0 flex-1 bg-surface lg:grid-cols-[minmax(0,1fr)_288px] 2xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-h-0 min-w-0 flex-col px-4 py-3">
            <section className="flex min-h-0 flex-1 flex-col">
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#e5eaf0] pb-3">
                <h2 className="flex items-center gap-2 text-[13px] font-semibold text-[#102445]">
                  <MessagesSquare className="h-4 w-4 text-[#536a85]" />
                  Conversation
                </h2>
                {isCommentsLoading ? (
                  <Skeleton className="h-[22px] w-16 rounded-[5px]" />
                ) : (
                  <span className="rounded-[5px] bg-[#f0f3f7] px-2 py-1 text-[9px] font-semibold text-ink-muted">
                    {comments.length} {comments.length === 1 ? "reply" : "replies"}
                  </span>
                )}
              </div>
              <div
                className="conversation-scrollbar min-h-0 flex-1 overflow-y-auto pr-2"
                aria-busy={isCommentsLoading}
              >
                {isCommentsLoading ? (
                  <>
                    <span className="sr-only">Loading conversation</span>
                    <CommentSkeleton />
                    <CommentSkeleton />
                  </>
                ) : comments.length === 0 ? (
                  <EmptyState
                    icon={<MessagesSquare />}
                    title="No replies yet"
                    description="Send an email reply to the requester, or leave an internal note for your team."
                  />
                ) : (
                  comments.map((comment) => {
                    const presentation = getCommentPresentation(comment);

                    return (
                      <article
                        key={comment.id}
                        className={`my-2 rounded-[6px] border border-[#dfe5ec] border-l-[3px] px-3 py-3 ${presentation.className}`}
                      >
                        <div className="mb-3 flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="truncate text-[12px] font-semibold text-[#102445]">
                                {comment.authorName || comment.authorType}
                              </span>
                              <span
                                className={`inline-flex items-center rounded-[5px] border px-2 py-0.5 text-[9px] font-semibold ${presentation.badgeClassName}`}
                              >
                                {presentation.label}
                              </span>
                            </div>
                            {comment.authorEmail && (
                              <p className="mt-0.5 truncate text-[10px] text-[#718198]">
                                {comment.authorEmail}
                              </p>
                            )}
                          </div>
                          <time className="shrink-0 text-[10px] text-[#718198]">
                            {new Date(comment.createdAt).toLocaleString()}
                          </time>
                        </div>
                        <div className="overflow-x-auto text-sm text-[#4a5f78]">
                          <EmailBody value={comment.body} />
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>

            <section className="shrink-0 border-t border-[#dfe5ec] pt-3">
              <Label
                htmlFor="desktop-ticket-message"
                className="flex items-center gap-2 text-[12px] font-semibold text-[#102445]"
              >
                <MessageSquareText className="h-4 w-4 text-[#536a85]" />
                Add to conversation
              </Label>
              <Textarea
                id="desktop-ticket-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="mt-2 min-h-20 rounded-[7px] border-[#d9e1ea] text-sm focus-visible:ring-[#146ef5]"
                placeholder="Write an internal note or email reply..."
              />
              <div className="mt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={addConversationMessage}
                  loading={isSendingMessage}
                  loadingText="Adding note..."
                  disabled={!message.trim() || isSendingReply}
                >
                  <LockKeyhole className="h-4 w-4" />
                  Add internal note
                </Button>
                <Button
                  type="button"
                  onClick={sendEmailReply}
                  loading={isSendingReply}
                  loadingText="Sending..."
                  disabled={!message.trim() || isSendingMessage}
                >
                  <SendHorizontal className="h-4 w-4" />
                  Send reply
                </Button>
              </div>
            </section>
          </div>

          <aside className="h-full overflow-y-auto border-l border-[#dfe5ec] bg-surface-muted px-4 py-3">
            <section className="border-b border-[#dfe5ec] pb-4">
              <h2 className="text-[12px] font-semibold text-[#102445]">Ticket details</h2>
              <dl className="mt-4 space-y-4">
                <DetailItem
                  label="Requester"
                  value={activeTicket.requester}
                  icon={<ContactRound className="h-3.5 w-3.5" />}
                />
                <DetailItem
                  label="Created"
                  value={formatDate(activeTicket.createdAt)}
                  icon={<CalendarClock className="h-3.5 w-3.5" />}
                />
                <DetailItem
                  label="Assignee"
                  value={
                    activeTicket.assignee || (user.role === "officer" ? user.name : "Unassigned")
                  }
                  icon={<BadgeCheck className="h-3.5 w-3.5" />}
                />
              </dl>

              {user.role === "admin" && (
                <div className="mt-5 border-t border-[#e5eaf0] pt-4">
                  <Label
                    htmlFor="desktop-ticket-assignee"
                    className="flex items-center gap-2 text-[11px] font-semibold text-[#102445]"
                  >
                    <UserRoundCheck className="h-4 w-4 text-[#536a85]" />
                    Change assignee
                  </Label>
                  <div className="relative mt-2">
                    <select
                      id="desktop-ticket-assignee"
                      value={draftUserId}
                      onChange={(event) => void assignTicket(event.target.value)}
                      disabled={isAssigning || isTerminal}
                      aria-busy={isAssigning}
                      className="h-10 w-full cursor-pointer rounded-field border border-[#d9e1ea] bg-surface px-3 pr-9 text-[11px] text-[#263b59] outline-none transition-[border-color,box-shadow] hover:border-[#c5d1dd] focus:border-brand focus:ring-2 focus:ring-brand-ring disabled:cursor-not-allowed disabled:bg-[#f4f6f8] disabled:opacity-70"
                    >
                      <option value="" disabled>
                        Select assignee
                      </option>
                      {users.map((staffUser) => (
                        <option key={staffUser.id} value={staffUser.id}>
                          {staffUser.name}
                        </option>
                      ))}
                    </select>
                    {isAssigning && (
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brand">
                        <Spinner className="h-3.5 w-3.5" label="Assigning ticket" />
                      </span>
                    )}
                  </div>
                  {isAssigning && (
                    <p aria-live="polite" className="mt-1.5 text-[10px] text-ink-muted">
                      Assigning...
                    </p>
                  )}
                </div>
              )}
            </section>

            <section className="border-b border-[#dfe5ec] py-4">
              <button
                type="button"
                aria-expanded={isAttachmentsOpen}
                aria-controls="desktop-ticket-attachments"
                onClick={() => setIsAttachmentsOpen((open) => !open)}
                className="flex w-full items-center justify-between gap-3 text-left"
              >
                <span className="flex items-center gap-2 text-[12px] font-semibold text-[#102445]">
                  <Paperclip className="h-4 w-4 text-[#536a85]" />
                  Attachments
                  {isAttachmentsLoading ? (
                    <Skeleton className="h-4 w-6 rounded-[4px]" />
                  ) : (
                    <span className="rounded-[4px] bg-[#e9eef4] px-2 py-0.5 text-[9px] text-ink-muted">
                      {attachments.length}
                    </span>
                  )}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-ink-muted transition-transform ${isAttachmentsOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isAttachmentsOpen && (
                <div id="desktop-ticket-attachments" className="mt-3">
                  {isAttachmentsLoading ? (
                    <AttachmentSkeleton />
                  ) : attachments.length === 0 ? (
                    <p className="rounded-field border border-dashed border-[#d9e1ea] p-3 text-[10px] text-[#718198]">
                      No attachments.
                    </p>
                  ) : (
                    <ul className="divide-y divide-[#e2e7ee] rounded-field border border-[#dfe5ec]">
                      {attachments.map((attachment) => {
                        const isDownloading = downloadingAttachmentId === attachment.id;

                        return (
                          <li key={attachment.id}>
                            <button
                              type="button"
                              onClick={() => downloadAttachment(attachment)}
                              disabled={downloadingAttachmentId !== null}
                              aria-busy={isDownloading}
                              className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <span className="min-w-0 truncate text-[10px] font-medium text-[#263b59]">
                                {attachment.fileName}
                              </span>
                              {isDownloading ? (
                                <Spinner
                                  className="h-3.5 w-3.5 text-brand"
                                  label={`Downloading ${attachment.fileName}`}
                                />
                              ) : (
                                <Download className="h-3.5 w-3.5 shrink-0 text-ink-muted" />
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </section>

            <section className="pt-4">
              <h2 className="mb-3 text-[11px] font-semibold text-[#102445]">Ticket actions</h2>
              <div className="grid gap-2">
                <Button
                  type="button"
                  variant="success"
                  onClick={() => setIsCloseDialogOpen(true)}
                  disabled={isTerminal || isAssigning || isClosing || isCancelling}
                  className="w-full"
                >
                  <CircleCheckBig className="h-4 w-4" />
                  Close Ticket
                </Button>
                {user.role === "admin" && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={cancelSelectedTicket}
                    loading={isCancelling}
                    loadingText="Cancelling..."
                    disabled={isTerminal || isClosing}
                    className="w-full"
                  >
                    <CircleX className="h-4 w-4" />
                    Cancel Ticket
                  </Button>
                )}
              </div>
            </section>
          </aside>
        </div>
      </article>

      <Sheet open={Boolean(ticket) && !isDesktop} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="full"
          showOverlay={false}
          className="flex w-full flex-col overflow-hidden bg-white p-0 shadow-none lg:hidden"
        >
          <SheetHeader className="shrink-0 border-b border-[#e1e6ed] bg-white px-6 py-4 pr-14 text-left lg:px-10 lg:pr-16 xl:px-16 xl:pr-20">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="min-w-0 space-y-1">
                  <SheetDescription className="text-[10px] font-semibold tracking-[0.04em] text-[#146ef5]">
                    TK-{activeTicket.id}
                  </SheetDescription>
                  <SheetTitle className="truncate text-[16px] leading-6 text-[#0f2342]">
                    {activeTicket.title}
                  </SheetTitle>
                </div>
              </div>
              <StatusBadge status={activeTicket.status} />
            </div>
          </SheetHeader>

          <div className="drawer-scroll-region min-h-0 flex-1 divide-y divide-[#e2e7ee] overflow-y-auto overscroll-contain px-6 lg:px-10 xl:px-16">
            <div className="grid gap-3 py-4 sm:grid-cols-3">
              <DetailItem
                label="Requester"
                value={activeTicket.requester}
                icon={<ContactRound className="h-3.5 w-3.5" />}
              />
              <DetailItem
                label="Created"
                value={formatDate(activeTicket.createdAt)}
                icon={<CalendarClock className="h-3.5 w-3.5" />}
              />
              <DetailItem
                label="Assignee"
                value={
                  activeTicket.assignee || (user.role === "officer" ? user.name : "Unassigned")
                }
                icon={<BadgeCheck className="h-3.5 w-3.5" />}
              />
            </div>

            <section className="py-4">
              <button
                type="button"
                aria-expanded={isAttachmentsOpen}
                aria-controls="ticket-attachments"
                onClick={() => setIsAttachmentsOpen((open) => !open)}
                className="flex min-h-10 w-full items-center justify-between gap-3 rounded-[7px] border border-[#dfe5ec] bg-[#f9fbfd] px-3 text-left transition-colors hover:border-[#cbd7e3] hover:bg-[#f4f7fb]"
              >
                <span className="flex items-center gap-2 text-[12px] font-semibold text-[#102445]">
                  <Paperclip className="h-4 w-4 text-[#536a85]" />
                  Attachments
                  {isAttachmentsLoading ? (
                    <Skeleton className="h-4 w-6 rounded-[4px]" />
                  ) : (
                    <span className="rounded-[4px] bg-[#e9eef4] px-2 py-0.5 text-[9px] font-medium text-ink-muted">
                      {attachments.length}
                    </span>
                  )}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-ink-muted transition-transform ${isAttachmentsOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isAttachmentsOpen && (
                <div id="ticket-attachments" className="mt-2">
                  {isAttachmentsLoading ? (
                    <AttachmentSkeleton />
                  ) : attachments.length === 0 ? (
                    <p className="rounded-field border border-dashed border-[#d9e1ea] px-3 py-3 text-[11px] text-[#718198]">
                      No attachments.
                    </p>
                  ) : (
                    <ul className="attachment-scrollbar max-h-44 divide-y divide-[#e2e7ee] overflow-y-auto rounded-field border border-[#dfe5ec] bg-surface">
                      {attachments.map((attachment) => {
                        const isDownloading = downloadingAttachmentId === attachment.id;

                        return (
                          <li key={attachment.id}>
                            <button
                              type="button"
                              onClick={() => downloadAttachment(attachment)}
                              disabled={downloadingAttachmentId !== null}
                              aria-busy={isDownloading}
                              className="flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 text-left text-[11px] transition-colors hover:bg-surface-muted disabled:opacity-60"
                            >
                              <span className="truncate font-medium">{attachment.fileName}</span>
                              <span className="flex shrink-0 items-center gap-2 text-[10px] text-ink-muted">
                                {formatAttachmentSize(attachment.sizeBytes)}
                                {isDownloading ? (
                                  <Spinner
                                    className="h-3.5 w-3.5 text-brand"
                                    label={`Downloading ${attachment.fileName}`}
                                  />
                                ) : (
                                  <Download className="h-3.5 w-3.5" />
                                )}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </section>

            <section className="py-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <Label className="flex items-center gap-2 text-[12px] font-semibold text-[#102445]">
                  <MessagesSquare className="h-4 w-4" />
                  Conversation
                </Label>
                {isCommentsLoading ? (
                  <Skeleton className="h-[22px] w-16 rounded-[4px]" />
                ) : (
                  <span className="rounded-[4px] bg-[#f0f3f7] px-2 py-1 text-[9px] font-medium text-ink-muted">
                    {comments.length} {comments.length === 1 ? "reply" : "replies"}
                  </span>
                )}
              </div>
              <div className="space-y-2" aria-busy={isCommentsLoading}>
                {isCommentsLoading ? (
                  <>
                    <span className="sr-only">Loading conversation</span>
                    <CommentSkeleton />
                    <CommentSkeleton />
                  </>
                ) : comments.length === 0 ? (
                  <EmptyState
                    icon={<MessagesSquare />}
                    title="No replies yet"
                    description="Send an email reply to the requester, or leave an internal note for your team."
                  />
                ) : (
                  comments.map((comment) => {
                    const presentation = getCommentPresentation(comment);

                    return (
                      <div
                        key={comment.id}
                        className={`rounded-[7px] border border-[#dfe5ec] border-l-[3px] px-3 py-3 text-sm shadow-none ${presentation.className}`}
                      >
                        <div className="mb-1 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="min-w-0 truncate font-medium">
                                {comment.authorName || comment.authorType}
                              </span>
                              <span
                                className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${presentation.badgeClassName}`}
                              >
                                {presentation.label}
                              </span>
                            </div>
                            {comment.authorEmail && (
                              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                {comment.authorEmail}
                              </p>
                            )}
                          </div>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="overflow-x-auto text-muted-foreground">
                          <EmailBody value={comment.body} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            <section className="py-4">
              <div className="mb-3">
                <Label
                  htmlFor="ticket-message"
                  className="flex items-center gap-2 text-[12px] font-semibold text-[#102445]"
                >
                  <MessageSquareText className="h-4 w-4 text-[#536a85]" />
                  Message
                </Label>
              </div>
              <Textarea
                id="ticket-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="min-h-32 rounded-[7px] border-[#d9e1ea] text-sm focus-visible:ring-[#146ef5]"
                placeholder="Write a message for this ticket conversation..."
              />
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={addConversationMessage}
                  loading={isSendingMessage}
                  loadingText="Adding note..."
                  disabled={!message.trim() || isSendingReply}
                >
                  <LockKeyhole className="h-4 w-4" />
                  Add internal note
                </Button>
                <Button
                  type="button"
                  onClick={sendEmailReply}
                  loading={isSendingReply}
                  loadingText="Sending..."
                  disabled={!message.trim() || isSendingMessage}
                >
                  <SendHorizontal className="h-4 w-4" />
                  Send reply
                </Button>
              </div>
            </section>

            {user.role === "admin" && (
              <section className="py-4">
                <div className="mb-3">
                  <Label
                    htmlFor="ticket-assignee"
                    className="flex items-center gap-2 text-[12px] font-semibold text-[#102445]"
                  >
                    <UserRoundCheck className="h-4 w-4 text-[#536a85]" />
                    Assignee
                  </Label>
                </div>
                <div className="relative">
                  <select
                    id="ticket-assignee"
                    value={draftUserId}
                    onChange={(event) => void assignTicket(event.target.value)}
                    disabled={isAssigning || isTerminal}
                    aria-busy={isAssigning}
                    className="h-10 w-full rounded-field border border-[#d9e1ea] bg-surface px-3 pr-9 text-sm text-[#263b59] outline-none transition-[border-color,box-shadow] focus:border-brand focus:ring-2 focus:ring-brand-ring disabled:bg-[#f4f6f8] disabled:opacity-70"
                  >
                    <option value="" disabled>
                      Select assignee
                    </option>
                    {users.map((staffUser) => (
                      <option key={staffUser.id} value={staffUser.id}>
                        {staffUser.name}
                      </option>
                    ))}
                  </select>
                  {isAssigning && (
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brand">
                      <Spinner className="h-4 w-4" label="Assigning ticket" />
                    </span>
                  )}
                </div>
              </section>
            )}
          </div>

          <SheetFooter className="shrink-0 border-t border-[#dfe5ec] bg-white px-6 py-4 !flex flex-col gap-2 shadow-[0_-4px_12px_rgba(15,35,66,0.04)] sm:flex-row sm:justify-end sm:space-x-0 lg:px-10 xl:px-16">
            {user.role === "admin" && (
              <Button
                type="button"
                variant="destructive"
                onClick={cancelSelectedTicket}
                loading={isCancelling}
                loadingText="Cancelling..."
                disabled={isTerminal || isClosing}
                className="w-full sm:w-auto sm:min-w-[150px]"
              >
                <CircleX className="h-4 w-4" />
                Cancel Ticket
              </Button>
            )}

            <Button
              type="button"
              variant="success"
              onClick={() => setIsCloseDialogOpen(true)}
              disabled={isTerminal || isAssigning || isClosing || isCancelling}
              className="w-full sm:w-auto sm:min-w-[150px]"
            >
              <CircleCheckBig className="h-4 w-4" />
              Close Ticket
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <Dialog
        open={isCloseDialogOpen}
        onOpenChange={(open) => {
          if (!isClosing) setIsCloseDialogOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CircleCheckBig className="h-4 w-4 text-success" />
              Close TK-{activeTicket.id}
            </DialogTitle>
            <DialogDescription>
              Add an optional final message, or leave it empty to send the default closed-ticket
              email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="closing-message">Closing message</Label>
            <Textarea
              id="closing-message"
              value={closingMessage}
              onChange={(event) => setClosingMessage(event.target.value)}
              className="min-h-32"
              placeholder="Optional resolution message..."
              disabled={isClosing}
            />
          </div>
          <DialogFooter className="!grid grid-cols-2 gap-2 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCloseDialogOpen(false)}
              disabled={isClosing}
              className="w-full"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="button"
              variant="success"
              onClick={closeSelectedTicket}
              loading={isClosing}
              loadingText="Closing..."
              className="w-full"
            >
              <CircleCheckBig className="h-4 w-4" />
              Close Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
