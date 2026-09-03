import type { User } from "../user";

export interface DashboardHeaderProps {
  isAdmin: boolean;
  isSidebarCollapsed: boolean;
  user: User;
  onAddStaff: () => void;
  onNewTicket: () => void;
  onLogout: () => void;
  onToggleSidebar: () => void;
}
