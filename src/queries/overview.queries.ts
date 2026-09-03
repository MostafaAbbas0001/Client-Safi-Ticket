import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./query-keys";
import { overviewService, type TicketOverviewQuery } from "@/services/overview.service";

export function useTicketOverviewQuery(query: TicketOverviewQuery) {
  return useQuery({
    queryKey: queryKeys.overview.tickets(query),
    queryFn: () => overviewService.getTicketOverview(query),
    staleTime: 30 * 1000,
  });
}
