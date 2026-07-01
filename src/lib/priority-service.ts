import { apiClient } from "./api-client";
import type { LookupItem } from "@/pages/dashboard/dashboard-data";

export const priorityService = {
  async getPriorities() {
    const priorities = await apiClient.get<LookupItem[]>("/api/priority");

    return Array.isArray(priorities) ? priorities : [];
  },
};
