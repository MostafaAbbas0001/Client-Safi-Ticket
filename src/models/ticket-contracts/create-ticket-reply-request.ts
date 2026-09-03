export interface CreateTicketReplyRequest {
  body: string;
  authorName?: string | null;
  authorEmail?: string | null;
  userId?: number | null;
}
