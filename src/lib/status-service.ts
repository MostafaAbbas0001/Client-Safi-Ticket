import { apiClient } from "./api-client";
import { ClientCache } from "./client-cache";
import type { LookupItem } from "@/pages/dashboard/dashboard-data";

const statusesCache = new ClientCache<LookupItem[]>(60 * 60 * 1000);

export const statusService = {
  async getStatuses() {
    const statuses = await statusesCache.get("statuses", () =>
      apiClient.get<LookupItem[]>("/api/status"),
    );

    return Array.isArray(statuses) ? statuses : [];
  },

  clearCache() {
    statusesCache.clear();
  },
};
