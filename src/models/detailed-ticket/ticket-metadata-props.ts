import type { Ticket } from "../ticket";
import type { User } from "../user";

export interface TicketMetadataProps {
  ticket: Ticket;
  user: User;
}
