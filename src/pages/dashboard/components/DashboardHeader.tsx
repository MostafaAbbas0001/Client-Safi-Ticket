import { LogOut, PlusCircle, ShieldCheck, UserCog, UserPlus } from "lucide-react";
import { safiLogoUrl } from "@/assets";
import { Button } from "@/components/ui/button";
import type { User } from "../dashboard-data";

interface DashboardHeaderProps {
  isAdmin: boolean;
  user: User;
  onAddStaff: () => void;
  onNewTicket: () => void;
  onLogout: () => void;
}

export function DashboardHeader({
  isAdmin,
  user,
  onAddStaff,
  onNewTicket,
  onLogout,
}: DashboardHeaderProps) {
  const RoleIcon = isAdmin ? ShieldCheck : UserCog;
  const roleLabel = isAdmin ? "Administrator" : "Officer";

  return (
    <header className="border-b bg-card/95 shadow-sm">
      <div className="grid w-full gap-3 px-4 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center lg:px-6">
        <div className="flex min-w-0 items-center gap-5">
          <div className="flex h-12 shrink-0 items-center">
            <img
              src={safiLogoUrl}
              alt="Safi Ticketing System"
              className="h-12 w-auto max-w-[220px] object-contain"
            />
          </div>

          <div className="hidden min-w-0 border-l pl-4 sm:block">
            <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {roleLabel} · {user.email}
            </p>
          </div>
        </div>

        <div className="min-w-0 sm:hidden">
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <RoleIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate font-semibold text-foreground">{user.name}</span>
            <span className="hidden text-muted-foreground sm:inline">·</span>
            <span className="hidden truncate text-muted-foreground sm:inline">{user.email}</span>
            <span className="hidden text-muted-foreground sm:inline">·</span>
            <span className="shrink-0 text-muted-foreground">{roleLabel}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-end md:col-start-2">
          {isAdmin && (
            <>
              <Button variant="outline" size="sm" className="h-9" onClick={onAddStaff}>
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Staff</span>
                <span className="sm:hidden">Staff</span>
              </Button>
              <Button size="sm" className="h-9" onClick={onNewTicket}>
                <PlusCircle className="h-4 w-4" />
                <span>New ticket</span>
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            className={isAdmin ? "col-span-2 h-9 sm:col-span-1" : "h-9"}
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
