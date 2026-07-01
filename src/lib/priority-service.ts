import { apiClient } from "./api-client";
import type { LookupItem } from "@/pages/dashboard/dashboard-data";

export const priorityService = {
  getPriorities() {
    return apiClient.get<LookupItem[]>("/api/priority");
  },
};
