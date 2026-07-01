import { useEffect, useState } from "react";
import { Mail, MessageSquare, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  LookupItem,
  Ticket,
  TicketAttachment,
  TicketComment,
  User,
  UserLookupItem,
} from "../dashboard-data";
import { formatAttachmentSize, formatDate, STAFF_EDITABLE_STATUSES } from "../dashboard-utils";
import { PriorityBadge, StatusBadge } from "./TicketBadges";

interface TicketDrawerProps {
  ticket: Ticket | null;
  user: User;
  statuses: LookupItem[];
  priorities: LookupItem[];
  users: UserLookupItem[];
  comments: TicketComment[];
  attachments: TicketAttachment[];
  onClose: () => void;
  onSave: (ticket: Ticket) => Promise<void>;
  onDelete: (ticketId: number) => Promise<void>;
  onAddComment: (comment: Omit<TicketComment, "id" | "createdAt">) => Promise<void>;
  onReply: (reply: Omit<TicketComment, "id" | "createdAt" | "isInternalNote">) => Promise<void>;
}

export function TicketDrawer({
  ticket,
  user,
  statuses,
  priorities,
  users,
  comments,
  attachments,
  onClose,
  onSave,
  onDelete,
  onAddComment,
  onReply,
}: TicketDrawerProps) {
  const [draftStatusId, setDraftStatusId] = useState("");
  const [draftPriorityId, setDraftPriorityId] = useState("");
  const [draftUserId, setDraftUserId] = useState("");
  const [message, setMessage] = useState("");
  const [visibleTicket, setVisibleTicket] = useState<Ticket | null>(ticket);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
    setDraftStatusId(activeTicket?.statusId ? String(activeTicket.statusId) : "");
    setDraftPriorityId(activeTicket?.priorityId ? String(activeTicket.priorityId) : "");
    setDraftUserId(activeTicket?.userId != null ? String(activeTicket.userId) : "");
    setMessage("");
  }, [activeTicket?.id, activeTicket?.priorityId, activeTicket?.statusId, activeTicket?.userId]);

  if (!activeTicket) return null;

  const editableStatuses =
    user.role === "admin"
      ? statuses
      : statuses.filter((item) => STAFF_EDITABLE_STATUSES.includes(item.name));

  const saveChanges = async () => {
    const statusId = draftStatusId ? Number(draftStatusId) : activeTicket.statusId;
    const priorityId = draftPriorityId ? Number(draftPriorityId) : activeTicket.priorityId;
    const assignedUserId = draftUserId ? Number(draftUserId) : null;
    const selectedStatus = statuses.find((status) => status.id === statusId);
    const selectedPriority = priorities.find((priority) => priority.id === priorityId);
    const selectedUser = users.find((staffUser) => staffUser.id === assignedUserId);

    try {
      setIsSaving(true);
      await onSave({
        ...activeTicket,
        statusId,
        status: selectedStatus?.name ?? activeTicket.status,
        priorityId,
        priority: selectedPriority?.name ?? activeTicket.priority ?? null,
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
        isInternalNote: false,
      });
      setMessage("");
      toast.success("Message added");
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

  const deleteSelectedTicket = async () => {
    if (user.role !== "admin") return;

    try {
      setIsDeleting(true);
      await onDelete(activeTicket.id);
      toast.success("Ticket deleted");
      onClose();
    } catch {
      toast.error("Failed to delete ticket");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Sheet open={Boolean(ticket)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col overflow-y-auto sm:max-w-xl">
        <SheetHeader className="pr-8">
          <SheetTitle>{activeTicket.title}</SheetTitle>
          <SheetDescription>TK-{activeTicket.id}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Requester</p>
              <p className="font-medium">{activeTicket.requester}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Created</p>
              <p className="font-medium">{formatDate(activeTicket.createdAt)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Current status</p>
              <div className="mt-1">
                <StatusBadge status={activeTicket.status} />
              </div>
            </div>
            <div>
              <p className="text-muted-foreground">Current priority</p>
              <div className="mt-1">
                <PriorityBadge priority={activeTicket.priority ?? "N/A"} />
              </div>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">Current assignee</p>
              <p className="font-medium">
                {activeTicket.assignee || (user.role === "officer" ? user.name : "Unassigned")}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Full body</Label>
            <div className="min-h-32 whitespace-pre-wrap rounded-lg border bg-muted/30 p-3 text-sm leading-6">
              {activeTicket.body?.trim() || "No body provided."}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Label className="flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Attachments
              </Label>
              <span className="rounded-full border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                {attachments.length}
              </span>
            </div>
            <div className="rounded-lg border bg-muted/20 p-3">
              {attachments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No attachments.</p>
              ) : (
                <ul className="space-y-2">
                  {attachments.map((attachment) => (
                    <li key={attachment.id}>
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between gap-3 rounded-md bg-background px-3 py-2 text-sm hover:bg-muted"
                      >
                        <span className="truncate font-medium">{attachment.fileName}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatAttachmentSize(attachment.sizeBytes)}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Label className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Conversation
              </Label>
              <span className="rounded-full border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                {comments.length} {comments.length === 1 ? "reply" : "replies"}
              </span>
            </div>
            <div className="max-h-56 space-y-3 overflow-y-auto rounded-lg border bg-muted/20 p-3">
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No replies yet.</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="rounded-lg bg-background p-3 text-sm">
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <span className="font-medium">
                        {comment.authorName || comment.authorType}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-muted-foreground">{comment.body}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticket-message">Message</Label>
            <Textarea
              id="ticket-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="min-h-28"
              placeholder="Write a message for this ticket conversation..."
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={addConversationMessage}
                disabled={!message.trim() || isSendingMessage || isSendingReply}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                {isSendingMessage ? "Adding..." : "Add to conversation"}
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
          </div>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="ticket-status">Status</Label>
              <select
                id="ticket-status"
                value={draftStatusId}
                onChange={(event) => setDraftStatusId(event.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="" disabled>
                  Select status
                </option>
                {editableStatuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticket-priority">Priority</Label>
              <select
                id="ticket-priority"
                value={draftPriorityId}
                onChange={(event) => setDraftPriorityId(event.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="" disabled>
                  {priorities.length > 0 ? "Select priority" : "N/A"}
                </option>
                {priorities.map((priority) => (
                  <option key={priority.id} value={priority.id}>
                    {priority.name}
                  </option>
                ))}
              </select>
            </div>

            {user.role === "admin" && (
              <div className="space-y-2">
                <Label htmlFor="ticket-assignee">Assignee</Label>
                <select
                  id="ticket-assignee"
                  value={draftUserId}
                  onChange={(event) => setDraftUserId(event.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Unassigned</option>
                  {users.map((staffUser) => (
                    <option key={staffUser.id} value={staffUser.id}>
                      {staffUser.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="mt-8">
          {user.role === "admin" && (
            <Button
              type="button"
              variant="destructive"
              onClick={deleteSelectedTicket}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={saveChanges} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
