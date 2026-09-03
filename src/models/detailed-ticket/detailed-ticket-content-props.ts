import type { Ticket } from "../ticket";
import type { TicketAttachment } from "../ticket-attachment";
import type { TicketComment } from "../ticket-comment";
import type { User } from "../user";
import type { UserLookupItem } from "../user-lookup-item";

export interface DetailedTicketContentProps {
  ticket: Ticket;
  user: User;
  users: UserLookupItem[];
  comments: TicketComment[];
  attachments: TicketAttachment[];
  message: string;
  draftUserId: string;
  downloadingAttachmentId: number | null;
  isCommentsLoading: boolean;
  isAttachmentsLoading: boolean;
  isAttachmentsOpen: boolean;
  isAssigning: boolean;
  isSendingMessage: boolean;
  isSendingReply: boolean;
  isCancelling: boolean;
  isClosing: boolean;
  isTerminal: boolean;
  onMessageChange: (message: string) => void;
  onAssign: (userId: string) => void;
  onToggleAttachments: () => void;
  onDownloadAttachment: (attachment: TicketAttachment) => void;
  onAddInternalNote: () => void;
  onSendReply: () => void;
  onOpenCloseDialog: () => void;
  onCancelTicket: () => void;
}
