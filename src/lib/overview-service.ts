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
  getTicketOverview(query: TicketOverviewQuery) {
    return apiClient.get<TicketOverview>("/api/overview/tickets", {
      query,
    });
  },
};
