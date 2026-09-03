import type { LookupItem } from "../lookup-item";
import type { UserLookupItem } from "../user-lookup-item";
import type { DailyTicketItem } from "./daily-ticket-item";
import type { StatusFilterItem } from "./status-filter-item";

export interface StatusFilterSectionProps {
  statusFilters: StatusFilterItem[];
  dailyTickets: DailyTicketItem[];
  totalCount: number;
  isLoading: boolean;
  search: string;
  userFilter: string;
  statusFilterIds: number[];
  showUserFilter: boolean;
  users: UserLookupItem[];
  statuses: LookupItem[];
  startDate: string;
  endDate: string;
  onSearchChange: (value: string) => void;
  onUserChange: (value: string) => void;
  onStatusChange: (value: number[]) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
}
