import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./query-keys";
import { roleService } from "@/services/role.service";

const ONE_HOUR = 60 * 60 * 1000;

export function useRolesQuery(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.roles.all,
    queryFn: roleService.getRoles,
    enabled,
    staleTime: ONE_HOUR,
  });
}
