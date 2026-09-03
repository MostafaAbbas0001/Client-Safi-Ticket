import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/sonner";
import { authSessionExpiredEvent } from "@/services/api-client";
import { authService } from "@/services/auth.service";
import type { AuthSession } from "@/models";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { LoginPage } from "@/pages/login/LoginPage";
import { DetailedTicketPage } from "@/pages/detailed-ticket/DetailedTicketPage";
import {
  getCurrentPathname,
  getTicketIdFromPath,
  isKnownApplicationPath,
  navigateToTicket,
  replaceWithDashboard,
  returnToDashboard,
  startPageTransition,
  subscribeToNavigation,
} from "@/lib/navigation";

export function App() {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<AuthSession | null>(() => authService.getSession());
  const pathname = useSyncExternalStore(subscribeToNavigation, getCurrentPathname, () => "/");
  const ticketId = getTicketIdFromPath(pathname);

  const handleLogin = (authSession: AuthSession) => {
    startPageTransition(() => setSession(authSession));
  };

  const handleLogout = useCallback(() => {
    replaceWithDashboard(() => {
      authService.logout();
      queryClient.clear();
      setSession(null);
    });
  }, [queryClient]);

  useEffect(() => {
    const handleExpiredSession = () => {
      replaceWithDashboard(() => {
        authService.logout();
        queryClient.clear();
        setSession(null);
      });
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

  useEffect(() => {
    if (session && !isKnownApplicationPath(pathname)) replaceWithDashboard();
  }, [pathname, session]);

  let page = <LoginPage onLogin={handleLogin} />;

  if (session) {
    page = ticketId ? (
      <DetailedTicketPage ticketId={ticketId} session={session} onBack={returnToDashboard} />
    ) : (
      <DashboardPage session={session} onLogout={handleLogout} onSelectTicket={navigateToTicket} />
    );
  }

  return (
    <>
      {page}
      <Toaster />
    </>
  );
}
