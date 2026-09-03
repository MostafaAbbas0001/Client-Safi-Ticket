import type { AuthSession } from "../auth";

export interface DashboardPageProps {
  session: AuthSession;
  onLogout: () => void;
  onSelectTicket: (ticketId: number) => void;
}
