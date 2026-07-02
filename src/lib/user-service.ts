import { apiClient } from "./api-client";
import { ClientCache } from "./client-cache";
import type { UserLookupItem } from "@/pages/dashboard/dashboard-data";

export interface CreateUserRequest {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  roleId: number;
}

const usersCache = new ClientCache<UserLookupItem[]>(5 * 60 * 1000);

export const userService = {
  async getUsers() {
    const users = await usersCache.get("users", () => apiClient.get<UserLookupItem[]>("/api/user"));

    return Array.isArray(users) ? users : [];
  },

  async createUser(request: CreateUserRequest) {
    const user = await apiClient.post<string>("/api/user", request);
    usersCache.clear();
    return user;
  },

  clearCache() {
    usersCache.clear();
  },
};
