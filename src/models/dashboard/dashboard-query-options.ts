import type { User } from "../user";

export interface DashboardQueryOptions {
  currentUser: User;
  page: number;
  userId?: number;
  statusIds?: number[];
  search?: string;
  startDate: string;
  endDate: string;
}
