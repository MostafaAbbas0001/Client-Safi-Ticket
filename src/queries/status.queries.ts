import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./query-keys";
import { statusService } from "@/services/status.service";

const ONE_HOUR = 60 * 60 * 1000;

export function useStatusesQuery() {
  return useQuery({
    queryKey: queryKeys.statuses.all,
    queryFn: statusService.getStatuses,
    staleTime: ONE_HOUR,
  });
}
