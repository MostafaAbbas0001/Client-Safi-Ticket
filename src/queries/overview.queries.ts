import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./query-keys";
import { overviewService } from "@/services/overview.service";
import type { TicketOverviewQuery } from "@/models";

export function useTicketOverviewQuery(query: TicketOverviewQuery) {
  return useQuery({
    queryKey: queryKeys.overview.tickets(query),
    queryFn: () => overviewService.getTicketOverview(query),
    staleTime: 30 * 1000,
  });
}
