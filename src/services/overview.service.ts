import { apiClient } from "./api-client";
import type { TicketOverview, TicketOverviewQuery } from "@/models";

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
