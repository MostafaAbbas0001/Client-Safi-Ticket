import { apiClient } from "./api-client";

export type OverviewTimeFrame = "all" | "today" | "7d" | "30d";

export interface TicketStatusOverview {
  id: number;
  name: string;
  count: number;
}

export interface TicketOverview {
  timeFrame: OverviewTimeFrame;
  totalCount: number;
  statuses: TicketStatusOverview[];
}

export interface TicketOverviewQuery {
  timeFrame: OverviewTimeFrame;
  userId?: number;
}

export const overviewService = {
  async getTicketOverview(query: TicketOverviewQuery) {
    const overview = await apiClient.get<TicketOverview>("/api/overview/tickets", {
      query,
    });

    return {
      ...overview,
      totalCount: overview.totalCount ?? 0,
      statuses: Array.isArray(overview.statuses) ? overview.statuses : [],
    };
  },
};
