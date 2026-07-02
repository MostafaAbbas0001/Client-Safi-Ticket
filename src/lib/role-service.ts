import { apiClient } from "./api-client";
import { ClientCache } from "./client-cache";
import type { LookupItem } from "@/pages/dashboard/dashboard-data";

const rolesCache = new ClientCache<LookupItem[]>(60 * 60 * 1000);

export const roleService = {
  async getRoles() {
    const roles = await rolesCache.get("roles", () => apiClient.get<LookupItem[]>("/api/role"));

    return Array.isArray(roles) ? roles : [];
  },

  clearCache() {
    rolesCache.clear();
  },
};
