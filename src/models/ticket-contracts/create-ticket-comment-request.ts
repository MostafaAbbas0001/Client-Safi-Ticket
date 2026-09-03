export interface CreateTicketCommentRequest {
  body: string;
  authorName?: string | null;
  authorEmail?: string | null;
  authorType?: string;
  isInternalNote?: boolean;
  userId?: number | null;
}
