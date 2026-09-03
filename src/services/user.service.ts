import { apiClient } from "./api-client";
import type { CreateUserRequest, UserLookupItem } from "@/models";

export const userService = {
  async getUsers() {
    const users = await apiClient.get<UserLookupItem[]>("/api/user");
    return Array.isArray(users) ? users : [];
  },

  createUser(request: CreateUserRequest) {
    return apiClient.post<string>("/api/user", request);
  },
};
