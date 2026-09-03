import { useState } from "react";
import {
  CircleUserRound,
  Gauge,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  TicketPlus,
  UserRoundPlus,
} from "lucide-react";
import { safiIconUrl, safiLogoUrl } from "@/assets";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { User } from "@/models/ticket";

interface DashboardHeaderProps {
  isAdmin: boolean;
  isSidebarCollapsed: boolean;
  user: User;
  onAddStaff: () => void;
  onNewTicket: () => void;
  onLogout: () => void;
  onToggleSidebar: () => void;
}

function SidebarAction({
  icon,
  label,
  onClick,
  active = false,
  danger = false,
  collapsed,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  danger?: boolean;
  collapsed: boolean;
}) {
  return (
    <button
      type="button"
      title={collapsed ? label : undefined}
      aria-label={label}
      onClick={onClick}
      className={`group flex h-10 w-full cursor-pointer items-center rounded-field text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring ${
        collapsed ? "justify-center" : "gap-3 px-3"
      } ${
        active
          ? "bg-brand-soft text-[#1268df] shadow-[inset_2px_0_0_var(--brand)]"
          : danger
            ? "text-[#b82739] hover:bg-[#fff5f6]"
            : "text-[#344a64] hover:bg-surface-muted hover:text-ink"
      }`}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">{icon}</span>
      <span
        className={`overflow-hidden whitespace-nowrap text-left transition-[width,opacity,transform] duration-150 ${
          collapsed ? "w-0 -translate-x-1 opacity-0" : "w-[120px] opacity-100 delay-75"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

export function DashboardHeader({
  isAdmin,
  isSidebarCollapsed,
  user,
  onAddStaff,
  onNewTicket,
  onLogout,
  onToggleSidebar,
}: DashboardHeaderProps) {
  const roleLabel = isAdmin ? "Administrator" : "Officer";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const runMobileAction = (action: () => void) => {
    setIsMobileMenuOpen(false);
    action();
  };

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 items-center border-b border-line bg-surface/95 px-4 backdrop-blur-sm lg:hidden">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Open navigation"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-field border border-[#d9e1ea] bg-surface text-[#3e536d] transition-colors hover:border-[#c5d1dd] hover:bg-surface-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring"
            >
              <Menu size={18} />
            </button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="flex w-[82vw] max-w-[300px] flex-col border-r border-[#dce3eb] bg-white p-0 shadow-[8px_0_24px_rgba(15,35,66,0.1)]"
          >
            <SheetHeader className="border-b border-[#e3e8ee] px-4 py-4 text-left">
              <img
                src={safiLogoUrl}
                alt="SAFITICKET IT Department"
                className="h-auto w-[158px] object-contain"
              />
              <SheetTitle className="sr-only">Navigation</SheetTitle>
            </SheetHeader>

            <div className="border-b border-[#e7ebf0] px-4 py-4">
              <div className="flex items-start gap-2.5">
                <CircleUserRound className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#48617b]" />
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold text-[#102445]">{user.name}</p>
                  <p className="mt-1 text-[10px] font-medium text-[#63748a]">{roleLabel}</p>
                  <p className="mt-0.5 truncate text-[10px] text-[#8290a2]">{user.email}</p>
                </div>
              </div>
            </div>

            <nav className="space-y-1 px-3 py-3" aria-label="Mobile navigation">
              <SheetClose asChild>
                <button
                  type="button"
                  className="flex h-10 w-full items-center gap-3 rounded-field bg-brand-soft px-3 text-[12px] font-medium text-[#1268df] shadow-[inset_2px_0_0_var(--brand)]"
                >
                  <Gauge size={17} />
                  Dashboard
                </button>
              </SheetClose>
              {isAdmin && (
                <SheetClose asChild>
                  <button
                    type="button"
                    onClick={() => runMobileAction(onAddStaff)}
                    className="flex h-10 w-full cursor-pointer items-center gap-3 rounded-field px-3 text-[12px] font-medium text-[#344a64] transition-colors hover:bg-surface-muted hover:text-ink"
                  >
                    <UserRoundPlus size={17} />
                    Add Staff
                  </button>
                </SheetClose>
              )}
              <SheetClose asChild>
                <button
                  type="button"
                  onClick={() => runMobileAction(onNewTicket)}
                  className="flex h-10 w-full items-center gap-3 rounded-[6px] px-3 text-[12px] font-medium text-[#344a64] hover:bg-[#f5f7fa]"
                >
                  <TicketPlus size={17} />
                  New Ticket
                </button>
              </SheetClose>
              <SheetClose asChild>
                <button
                  type="button"
                  onClick={() => runMobileAction(onLogout)}
                  className="flex h-10 w-full cursor-pointer items-center gap-3 rounded-field px-3 text-[12px] font-medium text-[#b82739] transition-colors hover:bg-[#fff5f6]"
                >
                  <LogOut size={17} />
                  Sign Out
                </button>
              </SheetClose>
            </nav>
          </SheetContent>
        </Sheet>

        <img
          src={safiLogoUrl}
          alt="SAFITICKET IT Department"
          className="absolute left-1/2 h-auto w-[150px] -translate-x-1/2 object-contain"
        />
      </header>

      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden border-r border-line bg-surface py-4 transition-[width,padding] duration-200 lg:flex lg:flex-col ${
          isSidebarCollapsed ? "w-[72px] px-2" : "w-[212px] px-3"
        }`}
      >
        <div className="relative h-[52px] w-full overflow-hidden">
          <img
            src={safiLogoUrl}
            alt="SAFITICKET IT Department"
            className={`absolute left-1/2 top-0 h-auto w-[166px] -translate-x-1/2 object-contain transition-opacity ${
              isSidebarCollapsed ? "opacity-0 duration-100" : "opacity-100 delay-100 duration-150"
            }`}
          />
          <img
            src={safiIconUrl}
            alt=""
            aria-hidden="true"
            className={`absolute left-1/2 top-0 h-8 w-8 -translate-x-1/2 object-contain transition-opacity ${
              isSidebarCollapsed ? "opacity-100 delay-100 duration-150" : "opacity-0 duration-100"
            }`}
          />
        </div>

        <div
          title={isSidebarCollapsed ? `${user.name} - ${roleLabel}` : undefined}
          className={`mt-2 flex h-[62px] items-center overflow-hidden border-y border-[#e7ebf0] transition-[padding] duration-200 ${
            isSidebarCollapsed ? "justify-center" : "gap-2.5 px-2"
          }`}
        >
          <CircleUserRound className="h-[18px] w-[18px] shrink-0 text-[#48617b]" />
          <div
            className={`min-w-0 overflow-hidden whitespace-nowrap transition-[width,opacity,transform] duration-150 ${
              isSidebarCollapsed
                ? "w-0 -translate-x-1 opacity-0"
                : "w-[150px] opacity-100 delay-100"
            }`}
          >
            <p className="truncate text-[11px] font-semibold text-[#102445]">{user.name}</p>
            <p className="mt-1 truncate text-[9px] font-medium text-[#63748a]">{roleLabel}</p>
            <p className="mt-0.5 truncate text-[9px] text-[#8290a2]">{user.email}</p>
          </div>
        </div>

        <nav aria-label="Primary navigation" className="mt-3 space-y-1">
          <SidebarAction
            icon={<Gauge size={17} />}
            label="Dashboard"
            active
            collapsed={isSidebarCollapsed}
          />
          {isAdmin && (
            <SidebarAction
              icon={<UserRoundPlus size={17} />}
              label="Add Staff"
              onClick={onAddStaff}
              collapsed={isSidebarCollapsed}
            />
          )}
          <SidebarAction
            icon={<TicketPlus size={17} />}
            label="New Ticket"
            onClick={onNewTicket}
            collapsed={isSidebarCollapsed}
          />
          <SidebarAction
            icon={<LogOut size={17} />}
            label="Sign Out"
            onClick={onLogout}
            danger
            collapsed={isSidebarCollapsed}
          />
        </nav>

        <div className="mt-auto border-t border-[#e7ebf0] pt-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`flex h-9 w-full cursor-pointer items-center rounded-field text-[11px] font-medium text-[#5a6d83] transition-colors hover:bg-surface-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring ${
              isSidebarCollapsed ? "justify-center" : "gap-3 px-3"
            }`}
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center">
              {isSidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </span>
            <span
              className={`overflow-hidden whitespace-nowrap transition-[width,opacity] duration-150 ${
                isSidebarCollapsed ? "w-0 opacity-0" : "w-[120px] opacity-100 delay-75"
              }`}
            >
              Collapse sidebar
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
