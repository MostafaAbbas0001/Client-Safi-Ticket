import { apiClient } from "./api-client";

export interface TicketStatusOverview {
  id: number;
  name: string;
  count: number;
}

export interface TicketDailyOverview {
  date: string;
  count: number;
}

export interface TicketOverview {
  startDate?: string | null;
  endDate?: string | null;
  totalCount: number;
  statuses: TicketStatusOverview[];
  dailyTickets: TicketDailyOverview[];
}

export interface TicketOverviewQuery {
  startDate?: string;
  endDate?: string;
  userId?: number;
}

export const overviewService = {
  async getTicketOverview(query: TicketOverviewQuery) {
    const overview = await apiClient.get<TicketOverview>("/api/overview/tickets", { query });

    return {
      ...overview,
      totalCount: overview.totalCount ?? 0,
      statuses: Array.isArray(overview.statuses) ? overview.statuses : [],
      dailyTickets: Array.isArray(overview.dailyTickets) ? overview.dailyTickets : [],
    };
  },
};
