export interface TicketComment {
  id: number;
  ticketId: number;
  body: string;
  authorName?: string | null;
  authorEmail?: string | null;
  authorType: string;
  isInternalNote: boolean;
  userId?: number | null;
  createdAt: string;
}
