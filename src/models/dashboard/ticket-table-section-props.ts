import type { Ticket } from "../ticket";
import type { User } from "../user";

export interface TicketTableSectionProps {
  tickets: Ticket[];
  isAdmin: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  currentUser: User;
  page: number;
  pageCount: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (updater: (page: number) => number) => void;
  onSelectTicket: (ticket: Ticket) => void;
}
