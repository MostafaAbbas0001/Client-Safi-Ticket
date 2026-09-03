import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.login,
    onSuccess: () => queryClient.clear(),
  });
}

export function useForgotPasswordMutation() {
  return useMutation({ mutationFn: authService.forgotPassword });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: ({
      email,
      token,
      newPassword,
    }: {
      email: string;
      token: string;
      newPassword: string;
    }) => authService.resetPassword(email, token, newPassword),
  });
}
