import { useMemo } from "react";
import { useTicketOverviewQuery } from "./overview.queries";
import { useRolesQuery } from "./role.queries";
import { useStatusesQuery } from "./status.queries";
import { useCreateTicketMutation, useTicketsQuery } from "./ticket.queries";
import { useCreateUserMutation, useUsersQuery } from "./user.queries";
import { staticStatuses, staticTickets, staticUsers } from "@/data/dashboard-fallbacks";
import type {
  CreateTicketWithAttachmentsRequest,
  CreateUserRequest,
  DashboardQueryOptions,
} from "@/models";

export function useDashboardQueries({
  currentUser,
  page,
  userId,
  statusIds,
  search,
  startDate,
  endDate,
}: DashboardQueryOptions) {
  const isAdmin = currentUser.role === "admin";
  const ticketQuery = {
    page,
    userId: isAdmin ? userId : currentUser.id,
    statusIds,
    search,
    startDate,
    endDate,
  };
  const overviewQuery = {
    startDate,
    endDate,
    userId: isAdmin ? undefined : currentUser.id,
  };
  const fallbackTicketSearch = useMemo(
    () => ({ items: staticTickets, page: 1, pageSize: 50, totalCount: staticTickets.length }),
    [],
  );
  const ticketsQuery = useTicketsQuery(ticketQuery, fallbackTicketSearch);
  const overviewResult = useTicketOverviewQuery(overviewQuery);
  const usersResult = useUsersQuery();
  const statusesResult = useStatusesQuery();
  const rolesResult = useRolesQuery(isAdmin);
  const createTicketMutation = useCreateTicketMutation();
  const createUserMutation = useCreateUserMutation();

  const addTicket = async (request: CreateTicketWithAttachmentsRequest) => {
    await createTicketMutation.mutateAsync(request);
  };

  const addStaffUser = async (request: CreateUserRequest) => {
    await createUserMutation.mutateAsync(request);
  };

  /*
   * These queries all seed themselves with placeholder data, so `isLoading` is
   * false from the first render and cannot tell "showing placeholders" apart
   * from "showing real rows". `dataUpdatedAt` only moves once a fetch actually
   * resolves, which is exactly the distinction the UI needs: skeletons before
   * the first real payload, a subtler refreshing treatment after it.
   */
  const hasLoadedTickets = ticketsQuery.dataUpdatedAt > 0;
  const hasLoadedOverview = overviewResult.dataUpdatedAt > 0;
  return {
    tickets: ticketsQuery.data?.items ?? staticTickets,
    ticketSearch: ticketsQuery.data,
    ticketOverview: overviewResult.data ?? null,
    users: usersResult.data ?? staticUsers,
    statuses: statusesResult.data ?? staticStatuses,
    roles: isAdmin ? (rolesResult.data ?? []) : [],
    isTicketsLoading: !hasLoadedTickets,
    isTicketsRefreshing: hasLoadedTickets && ticketsQuery.isFetching,
    isOverviewLoading: !hasLoadedOverview,
    isOverviewRefreshing: hasLoadedOverview && overviewResult.isFetching,
    addTicket,
    addStaffUser,
  };
}
