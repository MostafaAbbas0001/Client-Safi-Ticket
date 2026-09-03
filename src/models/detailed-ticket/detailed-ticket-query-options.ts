import type { User } from "../user";

export interface DetailedTicketQueryOptions {
  ticketId: number;
  currentUser: User;
}
