export interface TicketQuery {
  page?: number;
  statusId?: number;
  statusIds?: number[];
  userId?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}
