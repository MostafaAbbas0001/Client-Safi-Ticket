import type { ReactNode } from "react";

export interface SidebarActionProps {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  danger?: boolean;
  collapsed: boolean;
}
