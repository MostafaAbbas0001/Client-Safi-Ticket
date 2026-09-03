import type { AuthSession } from "../auth";

export interface DetailedTicketPageProps {
  ticketId: number;
  session: AuthSession;
  onBack: () => void;
}
