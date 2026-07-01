import { apiClient } from "./api-client";
import type { UserLookupItem } from "@/pages/dashboard/dashboard-data";

export interface CreateUserRequest {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  roleId: number;
}

export const userService = {
  getUsers() {
    return apiClient.get<UserLookupItem[]>("/api/user");
  },

  createUser(request: CreateUserRequest) {
    return apiClient.post<string>("/api/user", request);
  },
};
