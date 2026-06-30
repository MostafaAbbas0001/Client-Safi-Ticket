import { createFileRoute, Navigate, Outlet, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (!user) return <Navigate to="/login" />;

  // Role-based route protection
  if (user.role === "officer" && pathname.startsWith("/admin")) {
    return <Navigate to="/officer" />;
  }
  if (user.role === "admin" && pathname.startsWith("/officer")) {
    return <Navigate to="/admin" />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}