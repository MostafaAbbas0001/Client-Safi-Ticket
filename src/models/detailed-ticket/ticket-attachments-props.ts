import type { TicketAttachment } from "../ticket-attachment";

export interface TicketAttachmentsProps {
  attachments: TicketAttachment[];
  isLoading: boolean;
  isOpen: boolean;
  downloadingAttachmentId: number | null;
  onToggle: () => void;
  onDownload: (attachment: TicketAttachment) => void;
}
