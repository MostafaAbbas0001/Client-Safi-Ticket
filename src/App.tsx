import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { authSessionExpiredEvent } from "@/services/api-client";
import { authService, type AuthSession } from "@/services/auth.service";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { LoginPage } from "@/pages/login/LoginPage";

export function App() {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<AuthSession | null>(() => authService.getSession());

  const handleLogin = (authSession: AuthSession) => {
    setSession(authSession);
  };

  const handleLogout = useCallback(() => {
    authService.logout();
    queryClient.clear();
    setSession(null);
  }, [queryClient]);

  useEffect(() => {
    const handleExpiredSession = () => {
      authService.logout();
      queryClient.clear();
      setSession(null);
    };

    window.addEventListener(authSessionExpiredEvent, handleExpiredSession);

    return () => window.removeEventListener(authSessionExpiredEvent, handleExpiredSession);
  }, [queryClient]);

  useEffect(() => {
    if (!session) {
      return undefined;
    }

    const expirationTime = authService.getSessionExpirationTime(session);

    if (expirationTime === null) {
      return undefined;
    }

    const expiresIn = expirationTime - Date.now();

    if (expiresIn <= 0) {
      handleLogout();
      return undefined;
    }

    const timeout = window.setTimeout(handleLogout, expiresIn);

    return () => window.clearTimeout(timeout);
  }, [handleLogout, session]);

  return (
    <>
      {!session ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <DashboardPage session={session} onLogout={handleLogout} />
      )}
      <Toaster />
    </>
  );
}
