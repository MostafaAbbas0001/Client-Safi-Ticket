import type { Ticket } from "../ticket";

export interface TicketSearchResponse {
  items: Ticket[];
  page: number;
  pageSize: number;
  totalCount: number;
}
