import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./query-keys";
import { userService } from "@/services/user.service";

const FIVE_MINUTES = 5 * 60 * 1000;

export function useUsersQuery() {
  return useQuery({
    queryKey: queryKeys.users.all,
    queryFn: userService.getUsers,
    staleTime: FIVE_MINUTES,
  });
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userService.createUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
  });
}
