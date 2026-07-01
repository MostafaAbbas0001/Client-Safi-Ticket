import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
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
