import { apiClient } from "./api-client";
import type { LookupItem } from "@/models/ticket";

export const statusService = {
  async getStatuses() {
    const statuses = await apiClient.get<LookupItem[]>("/api/status");
    return Array.isArray(statuses) ? statuses : [];
  },
};
