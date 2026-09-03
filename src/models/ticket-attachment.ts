export interface TicketAttachment {
  id: number;
  ticketId: number;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  url: string;
  downloadUrl?: string;
  uploadedAt: string;
}
