import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, PlusCircle, ShieldCheck, UserCog, UserPlus } from "lucide-react";
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

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function DashboardHeader({
  isAdmin,
  user,
  onAddStaff,
  onNewTicket,
  onLogout,
}: DashboardHeaderProps) {
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const RoleIcon = isAdmin ? ShieldCheck : UserCog;

  useEffect(() => {
    const closeAccountMenu = (event: MouseEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) {
        setIsAccountOpen(false);
      }
    };

    document.addEventListener("mousedown", closeAccountMenu);
    return () => document.removeEventListener("mousedown", closeAccountMenu);
  }, []);

  return (
    <header className="border-b bg-card/95 shadow-[0_8px_28px_rgba(15,15,15,0.04)] backdrop-blur">
      <div className="flex w-full flex-col gap-4 px-4 py-3 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <div className="flex min-w-0 flex-wrap items-center gap-8">
          <img
            src={safiLogoUrl}
            alt="Safi Ticketing System"
            className="h-16 w-auto max-w-[260px] object-contain"
          />

          <div ref={accountRef} className="relative">
            <button
              type="button"
              aria-expanded={isAccountOpen}
              onClick={() => setIsAccountOpen((current) => !current)}
              className="flex h-12 items-center gap-3 rounded-lg px-1.5 text-left transition-colors hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-secondary text-xs font-semibold text-foreground">
                {getInitials(user.name)}
              </span>
              <span className="hidden min-w-0 sm:block">
                <span className="block max-w-44 truncate text-sm font-semibold">{user.name}</span>
                <span className="mt-0.5 flex items-center gap-1 text-xs capitalize text-muted-foreground">
                  <RoleIcon className="h-3.5 w-3.5" />
                  {user.role}
                </span>
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                  isAccountOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isAccountOpen && (
              <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-lg border bg-card p-2 shadow-[0_18px_45px_rgba(15,15,15,0.14)]">
                <div className="flex items-center gap-3 border-b px-3 py-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">
                    {getInitials(user.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          {isAdmin && (
            <Button variant="outline" className="h-10 w-32" onClick={onAddStaff}>
              <UserPlus className="h-4 w-4" />
              Add Staff
            </Button>
          )}
          {isAdmin && (
            <Button className="h-10 w-32" onClick={onNewTicket}>
              <PlusCircle className="h-4 w-4" />
              New ticket
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
