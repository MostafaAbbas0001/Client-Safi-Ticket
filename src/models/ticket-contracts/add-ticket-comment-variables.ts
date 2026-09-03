import type { CreateTicketCommentRequest } from "./create-ticket-comment-request";

export interface AddTicketCommentVariables {
  ticketId: number;
  request: CreateTicketCommentRequest;
}
