import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Helpdesk — Ticketing System" },
      { name: "description", content: "Submit, assign, and resolve support tickets." },
    ],
  }),
  component: Index,
});

function Index() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return <Navigate to={user.role === "admin" ? "/admin" : "/officer"} />;
}
