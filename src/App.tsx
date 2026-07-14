import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { authSessionExpiredEvent } from "@/lib/api-client";
import { authService, type AuthSession } from "@/lib/auth-service";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { LoginPage } from "@/pages/login/LoginPage";

export function App() {
  const [session, setSession] = useState<AuthSession | null>(() => authService.getSession());

  const handleLogin = (authSession: AuthSession) => {
    setSession(authSession);
  };

  const handleLogout = () => {
    authService.logout();
    setSession(null);
  };

  useEffect(() => {
    const handleExpiredSession = () => {
      authService.logout();
      setSession(null);
    };

    window.addEventListener(authSessionExpiredEvent, handleExpiredSession);

    return () => window.removeEventListener(authSessionExpiredEvent, handleExpiredSession);
  }, []);

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
  }, [session]);

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
