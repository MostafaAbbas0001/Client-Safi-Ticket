import { useEffect, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  LockKeyhole,
  Mail,
  MessageSquare,
  Paperclip,
  UserCheck,
  UserCircle2,
  XCircle,
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
import { StatusBadge } from "./TicketBadges";

interface TicketDrawerProps {
  ticket: Ticket | null;
  user: User;
  users: UserLookupItem[];
  comments: TicketComment[];
  attachments: TicketAttachment[];
  onClose: () => void;
  onSave: (ticket: Ticket) => Promise<void>;
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
    <div className="space-y-1.5 border-l pl-3">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

function getCommentPresentation(comment: TicketComment) {
  if (comment.isInternalNote) {
    return {
      label: "Internal note",
      className: "border-l-amber-400 bg-amber-50/60",
      badgeClassName: "bg-amber-100 text-amber-800",
    };
  }

  if (comment.authorType.toLowerCase() === "requester") {
    return {
      label: "Requester email",
      className: "border-l-sky-400 bg-sky-50/60",
      badgeClassName: "bg-sky-100 text-sky-800",
    };
  }

  return {
    label: "Email reply",
    className: "border-l-emerald-500 bg-emerald-50/60",
    badgeClassName: "bg-emerald-100 text-emerald-800",
  };
}

export function TicketDrawer({
  ticket,
  user,
  users,
  comments,
  attachments,
  onClose,
  onSave,
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
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

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
    setIsCloseDialogOpen(false);
  }, [activeTicket?.id, activeTicket?.userId]);

  if (!activeTicket) return null;

  const normalizedStatus = activeTicket.status.toLowerCase().replace(/\s+/g, " ").trim();
  const isClosed = normalizedStatus === "closed";
  const isCancelled = normalizedStatus === "cancelled" || normalizedStatus === "canceled";
  const isTerminal = isClosed || isCancelled;

  const saveChanges = async () => {
    const assignedUserId = draftUserId ? Number(draftUserId) : null;
    const selectedUser = users.find((staffUser) => staffUser.id === assignedUserId);

    try {
      setIsSaving(true);
      await onSave({
        ...activeTicket,
        userId: user.role === "admin" ? assignedUserId : activeTicket.userId,
        assignee: user.role === "admin" ? (selectedUser?.name ?? null) : activeTicket.assignee,
      });

      toast.success("Ticket updated");
      onClose();
    } catch {
      toast.error("Failed to update ticket");
    } finally {
      setIsSaving(false);
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
    const downloadPath = attachment.downloadUrl ?? `/api/ticket/attachments/${attachment.id}/file`;

    try {
      const response = await fetch(getApiUrl(downloadPath), {
        headers: getAuthorizationHeaders(),
      });

      if (!response.ok) {
        throw new Error("Attachment download failed.");
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
    } catch {
      toast.error("Failed to download attachment");
    }
  };

  return (
    <>
      <Sheet open={Boolean(ticket)} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="right"
          className="flex w-full flex-col overflow-y-auto p-0 sm:max-w-2xl"
        >
          <SheetHeader className="border-b bg-muted/20 px-5 py-5 pr-12 text-left">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-2">
                <SheetDescription className="font-semibold">TK-{activeTicket.id}</SheetDescription>
                <SheetTitle className="text-xl leading-7">{activeTicket.title}</SheetTitle>
              </div>
              <StatusBadge status={activeTicket.status} />
            </div>
          </SheetHeader>

          <div className="flex-1 divide-y px-5">
            <div className="grid gap-4 py-5 sm:grid-cols-3">
              <DetailItem
                label="Requester"
                value={activeTicket.requester}
                icon={<UserCircle2 className="h-3.5 w-3.5" />}
              />
              <DetailItem
                label="Created"
                value={formatDate(activeTicket.createdAt)}
                icon={<CalendarDays className="h-3.5 w-3.5" />}
              />
              <DetailItem
                label="Assignee"
                value={
                  activeTicket.assignee || (user.role === "officer" ? user.name : "Unassigned")
                }
                icon={<UserCheck className="h-3.5 w-3.5" />}
              />
            </div>

            <section className="py-5">
              <div className="mb-3">
                <Label>Full body</Label>
              </div>
              <div className="min-h-28 whitespace-pre-wrap rounded-md bg-muted/30 px-4 py-3 text-sm leading-6 text-foreground">
                {activeTicket.body?.trim() || "No body provided."}
              </div>
            </section>

            <section className="py-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <Label className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Attachments
                </Label>
                <span className="rounded-full border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  {attachments.length}
                </span>
              </div>
              <div>
                {attachments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No attachments.</p>
                ) : (
                  <ul className="divide-y rounded-md border">
                    {attachments.map((attachment) => (
                      <li key={attachment.id}>
                        <button
                          type="button"
                          onClick={() => downloadAttachment(attachment)}
                          className="flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-muted"
                        >
                          <span className="truncate font-medium">{attachment.fileName}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {formatAttachmentSize(attachment.sizeBytes)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <section className="py-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <Label className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Conversation
                </Label>
                <span className="rounded-full border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  {comments.length} {comments.length === 1 ? "reply" : "replies"}
                </span>
              </div>
              <div className="max-h-72 space-y-2 overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No replies yet.</p>
                ) : (
                  comments.map((comment) => {
                    const presentation = getCommentPresentation(comment);

                    return (
                      <div
                        key={comment.id}
                        className={`rounded-md border-l-4 px-3 py-3 text-sm ${presentation.className}`}
                      >
                        <div className="mb-1 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="min-w-0 truncate font-medium">
                                {comment.authorName || comment.authorType}
                              </span>
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${presentation.badgeClassName}`}
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
                        <p className="whitespace-pre-wrap text-muted-foreground">{comment.body}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            <section className="py-5">
              <div className="mb-3">
                <Label htmlFor="ticket-message">Message</Label>
              </div>
              <Textarea
                id="ticket-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="min-h-32 rounded-md"
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
                  <Mail className="mr-2 h-4 w-4" />
                  {isSendingReply ? "Sending..." : "Send reply"}
                </Button>
              </div>
            </section>

            {user.role === "admin" && (
              <section className="py-5">
                <div className="mb-3">
                  <Label htmlFor="ticket-assignee">Assignee</Label>
                </div>
                <select
                  id="ticket-assignee"
                  value={draftUserId}
                  onChange={(event) => setDraftUserId(event.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary"
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
              </section>
            )}
          </div>

          <SheetFooter
            className={`border-t bg-background px-5 py-4 !grid gap-2 sm:space-x-0 ${user.role === "admin" ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}
          >
            {user.role === "admin" && (
              <Button
                type="button"
                variant="destructive"
                onClick={cancelSelectedTicket}
                disabled={isCancelling || isTerminal}
                className="w-full"
              >
                <XCircle className="h-4 w-4" />
                {isCancelling ? "Cancelling..." : "Cancel ticket"}
              </Button>
            )}

            <Button
              type="button"
              onClick={() => setIsCloseDialogOpen(true)}
              disabled={isTerminal || isSaving || isClosing}
              className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <CheckCircle2 className="h-4 w-4" />
              Close ticket
            </Button>
            <Button
              type="button"
              onClick={saveChanges}
              disabled={isSaving || isTerminal}
              className="w-full"
            >
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <Dialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close TK-{activeTicket.id}</DialogTitle>
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
              Cancel
            </Button>
            <Button
              type="button"
              onClick={closeSelectedTicket}
              disabled={isClosing}
              className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isClosing ? "Closing..." : "Close ticket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
