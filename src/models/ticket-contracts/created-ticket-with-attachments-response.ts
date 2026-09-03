import type { TicketAttachment } from "../ticket-attachment";

export interface CreatedTicketWithAttachmentsResponse {
  id: number;
  title: string;
  body: string;
  requester: string;
  requesterEmail?: string | null;
  statusId?: number | null;
  userId?: number | null;
  createdAt?: string;
  attachments?: TicketAttachment[];
}
