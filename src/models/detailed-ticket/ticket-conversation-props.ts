import type { TicketComment } from "../ticket-comment";

export interface TicketConversationProps {
  comments: TicketComment[];
  isLoading: boolean;
}
