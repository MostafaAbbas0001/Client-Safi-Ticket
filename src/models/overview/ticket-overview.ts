import type { TicketDailyOverview } from "./ticket-daily-overview";
import type { TicketStatusOverview } from "./ticket-status-overview";

export interface TicketOverview {
  startDate?: string | null;
  endDate?: string | null;
  totalCount: number;
  statuses: TicketStatusOverview[];
  dailyTickets: TicketDailyOverview[];
}
