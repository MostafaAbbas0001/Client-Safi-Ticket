import { apiClient } from "./api-client";
import type { LookupItem } from "@/models/ticket";

export const roleService = {
  async getRoles() {
    const roles = await apiClient.get<LookupItem[]>("/api/role");
    return Array.isArray(roles) ? roles : [];
  },
};
