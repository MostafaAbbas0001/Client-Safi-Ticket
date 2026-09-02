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
import { getApiUrl, getAuthorizationHeaders } from "@/lib/api-client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
} from "../dashboard-data";
import { formatAttachmentSize, formatDate } from "../dashboard-utils";
import { EmailBody } from "./EmailBody";
import { StatusBadge } from "./TicketBadges";

interface TicketDrawerProps {
  ticket: Ticket | null;
  user: User;
  users: UserLookupItem[];
  comments: TicketComment[];
  attachments: TicketAttachment[];
  onClose: () => void;
  onAssign: (ticket: Ticket) => Promise<void>;
  onCancel: (ticketId: number) => Promise<void>;
  onCloseTicket: (ticketId: number, body: string) => Promise<void>;
  onAddComment: (comment: Omit<TicketComment, "id" | "createdAt">) => Promise<void>;
  onReply: (reply: Omit<TicketComment, "id" | "createdAt" | "isInternalNote">) => Promise<void>;
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
  onClose,
  onAssign,
  onCancel,
  onCloseTicket,
  onAddComment,
  onReply,
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
    const downloadPath =
      attachment.downloadUrl?.trim() || `/api/ticket/attachments/${attachment.id}/file`;
    const downloadUrl = /^https?:\/\//i.test(downloadPath) ? downloadPath : getApiUrl(downloadPath);

    try {
      const response = await fetch(downloadUrl, {
        headers: getAuthorizationHeaders() as HeadersInit,
      });

      if (!response.ok) {
        const responseMessage = await response.text();
        throw new Error(responseMessage || `Attachment download failed (${response.status}).`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = attachment.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to download attachment");
    }
  };

  return (
    <>
      <article className="hidden h-[calc(100vh-32px)] w-full animate-in flex-col fade-in-0 duration-300 lg:flex">
        <header className="shrink-0 border-b border-[#dfe5ec] bg-background px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold text-[#526981] transition-colors hover:text-[#146ef5] cursor-pointer"
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

        <div className="grid min-h-0 flex-1 bg-background lg:grid-cols-[minmax(0,1fr)_288px] 2xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-h-0 min-w-0 flex-col px-4 py-3">
            <section className="flex min-h-0 flex-1 flex-col">
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#e5eaf0] pb-3">
                <h2 className="flex items-center gap-2 text-[13px] font-semibold text-[#102445]">
                  <MessagesSquare className="h-4 w-4 text-[#536a85]" />
                  Conversation
                </h2>
                <span className="rounded-[5px] bg-[#f0f3f7] px-2 py-1 text-[9px] font-semibold text-[#63748a]">
                  {comments.length} {comments.length === 1 ? "reply" : "replies"}
                </span>
              </div>
              <div className="conversation-scrollbar min-h-0 flex-1 overflow-y-auto pr-2">
                {comments.length === 0 ? (
                  <div className="py-10 text-center text-[11px] text-[#718198]">
                    No replies have been added yet.
                  </div>
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
                  disabled={!message.trim() || isSendingMessage || isSendingReply}
                >
                  <LockKeyhole className="h-4 w-4" />
                  {isSendingMessage ? "Adding..." : "Add internal note"}
                </Button>
                <Button
                  type="button"
                  onClick={sendEmailReply}
                  disabled={!message.trim() || isSendingMessage || isSendingReply}
                >
                  <SendHorizontal className="h-4 w-4" />
                  {isSendingReply ? "Sending..." : "Send reply"}
                </Button>
              </div>
            </section>
          </div>

          <aside className="h-full overflow-hidden border-l border-[#dfe5ec] bg-background px-4 py-3">
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
                  <select
                    id="desktop-ticket-assignee"
                    value={draftUserId}
                    onChange={(event) => void assignTicket(event.target.value)}
                    disabled={isAssigning || isTerminal}
                    className="mt-2 h-10 w-full rounded-[7px] border border-[#d9e1ea] bg-white px-3 text-[11px] text-[#263b59] outline-none focus:ring-2 focus:ring-[#146ef5]"
                  >
                    <option value="" disabled>
                      {isAssigning ? "Assigning..." : "Select assignee"}
                    </option>
                    {users.map((staffUser) => (
                      <option key={staffUser.id} value={staffUser.id}>
                        {staffUser.name}
                      </option>
                    ))}
                  </select>
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
                  <span className="rounded-[4px] bg-[#e9eef4] px-2 py-0.5 text-[9px] text-[#63748a]">
                    {attachments.length}
                  </span>
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-[#63748a] transition-transform ${isAttachmentsOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isAttachmentsOpen && (
                <div id="desktop-ticket-attachments" className="mt-3">
                  {attachments.length === 0 ? (
                    <p className="rounded-[7px] border border-dashed border-[#d9e1ea] p-3 text-[10px] text-[#718198]">
                      No attachments.
                    </p>
                  ) : (
                    <ul className="divide-y divide-[#e2e7ee] rounded-[7px] border border-[#dfe5ec]">
                      {attachments.map((attachment) => (
                        <li key={attachment.id}>
                          <button
                            type="button"
                            onClick={() => downloadAttachment(attachment)}
                            className="flex min-h-11 w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-[#f7f9fc]"
                          >
                            <span className="min-w-0 truncate text-[10px] font-medium text-[#263b59]">
                              {attachment.fileName}
                            </span>
                            <Download className="h-3.5 w-3.5 shrink-0 text-[#63748a]" />
                          </button>
                        </li>
                      ))}
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
                  onClick={() => setIsCloseDialogOpen(true)}
                  disabled={isTerminal || isAssigning || isClosing}
                  className="w-full bg-[#13a66d] text-white hover:bg-[#0e925f]"
                >
                  <CircleCheckBig className="h-4 w-4" />
                  Close Ticket
                </Button>
                {user.role === "admin" && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={cancelSelectedTicket}
                    disabled={isCancelling || isTerminal}
                    className="w-full border border-[#d91f37] bg-[#d91f37] text-white hover:border-[#bd1730] hover:bg-[#bd1730]"
                  >
                    <CircleX className="h-4 w-4" />
                    {isCancelling ? "Cancelling..." : "Cancel Ticket"}
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
                  <span className="rounded-[4px] bg-[#e9eef4] px-2 py-0.5 text-[9px] font-medium text-[#63748a]">
                    {attachments.length}
                  </span>
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-[#63748a] transition-transform ${isAttachmentsOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isAttachmentsOpen && (
                <div id="ticket-attachments" className="mt-2">
                  {attachments.length === 0 ? (
                    <p className="rounded-[7px] border border-dashed border-[#d9e1ea] px-3 py-3 text-[11px] text-[#718198]">
                      No attachments.
                    </p>
                  ) : (
                    <ul className="attachment-scrollbar max-h-44 divide-y divide-[#e2e7ee] overflow-y-auto rounded-[7px] border border-[#dfe5ec] bg-white">
                      {attachments.map((attachment) => (
                        <li key={attachment.id}>
                          <button
                            type="button"
                            onClick={() => downloadAttachment(attachment)}
                            className="flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 text-left text-[11px] hover:bg-[#f7f9fc]"
                          >
                            <span className="truncate font-medium">{attachment.fileName}</span>
                            <span className="flex shrink-0 items-center gap-2 text-[10px] text-[#63748a]">
                              {formatAttachmentSize(attachment.sizeBytes)}
                              <Download className="h-3.5 w-3.5" />
                            </span>
                          </button>
                        </li>
                      ))}
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
                <span className="rounded-[4px] bg-[#f0f3f7] px-2 py-1 text-[9px] font-medium text-[#63748a]">
                  {comments.length} {comments.length === 1 ? "reply" : "replies"}
                </span>
              </div>
              <div className="space-y-2">
                {comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No replies yet.</p>
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
                  disabled={!message.trim() || isSendingMessage || isSendingReply}
                >
                  <LockKeyhole className="mr-2 h-4 w-4" />
                  {isSendingMessage ? "Adding..." : "Add internal note"}
                </Button>
                <Button
                  type="button"
                  onClick={sendEmailReply}
                  disabled={!message.trim() || isSendingMessage || isSendingReply}
                >
                  <SendHorizontal className="mr-2 h-4 w-4" />
                  {isSendingReply ? "Sending..." : "Send reply"}
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
                <select
                  id="ticket-assignee"
                  value={draftUserId}
                  onChange={(event) => void assignTicket(event.target.value)}
                  disabled={isAssigning || isTerminal}
                  className="h-10 w-full rounded-[7px] border border-[#d9e1ea] bg-white px-3 text-sm text-[#263b59] outline-none focus:ring-2 focus:ring-[#146ef5]"
                >
                  <option value="" disabled>
                    {isAssigning ? "Assigning..." : "Select assignee"}
                  </option>
                  {users.map((staffUser) => (
                    <option key={staffUser.id} value={staffUser.id}>
                      {staffUser.name}
                    </option>
                  ))}
                </select>
              </section>
            )}
          </div>

          <SheetFooter className="shrink-0 border-t border-[#dfe5ec] bg-white px-6 py-4 !flex flex-col gap-2 shadow-[0_-4px_12px_rgba(15,35,66,0.04)] sm:flex-row sm:justify-end sm:space-x-0 lg:px-10 xl:px-16">
            {user.role === "admin" && (
              <Button
                type="button"
                variant="destructive"
                onClick={cancelSelectedTicket}
                disabled={isCancelling || isTerminal}
                className="w-full border border-[#d91f37] bg-[#d91f37] text-white hover:border-[#bd1730] hover:bg-[#bd1730] sm:w-auto sm:min-w-[150px]"
              >
                <CircleX className="h-4 w-4" />
                {isCancelling ? "Cancelling..." : "Cancel Ticket"}
              </Button>
            )}

            <Button
              type="button"
              onClick={() => setIsCloseDialogOpen(true)}
              disabled={isTerminal || isAssigning || isClosing}
              className="w-full bg-[#13a66d] text-white hover:bg-[#0e925f] sm:w-auto sm:min-w-[150px]"
            >
              <CircleCheckBig className="h-4 w-4" />
              Close Ticket
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <Dialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CircleCheckBig className="h-4 w-4 text-[#13a66d]" />
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
              onClick={closeSelectedTicket}
              disabled={isClosing}
              className="w-full bg-[#13a66d] text-white hover:bg-[#0e925f]"
            >
              <CircleCheckBig className="h-4 w-4" />
              {isClosing ? "Closing..." : "Close Ticket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
