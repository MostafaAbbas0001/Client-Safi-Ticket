import { apiClient } from "./api-client";
import { ClientCache, createCacheKey } from "./client-cache";

export interface TicketStatusOverview {
  id: number;
  name: string;
  count: number;
}

export interface TicketOverview {
  startDate?: string | null;
  endDate?: string | null;
  totalCount: number;
  statuses: TicketStatusOverview[];
}

export interface TicketOverviewQuery {
  startDate?: string;
  endDate?: string;
  userId?: number;
}

const overviewCache = new ClientCache<TicketOverview>(30 * 1000);

export const overviewService = {
  async getTicketOverview(query: TicketOverviewQuery) {
    const overview = await overviewCache.get(createCacheKey(query), () =>
      apiClient.get<TicketOverview>("/api/overview/tickets", {
        query,
      }),
    );

    return {
      ...overview,
      totalCount: overview.totalCount ?? 0,
      statuses: Array.isArray(overview.statuses) ? overview.statuses : [],
    };
  },

  clearCache() {
    overviewCache.clear();
  },
};
