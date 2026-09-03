import type { DailyTicketItem } from "./daily-ticket-item";
import type { StatusFilterItem } from "./status-filter-item";

export interface OverviewChartsProps {
  statusFilters: StatusFilterItem[];
  dailyTickets: DailyTicketItem[];
  totalCount: number;
  isLoading: boolean;
}
