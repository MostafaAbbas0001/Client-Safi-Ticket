import type { CreateTicketRequest } from "./create-ticket-request";

export interface CreateTicketWithAttachmentsRequest extends CreateTicketRequest {
  attachments?: File[];
}
