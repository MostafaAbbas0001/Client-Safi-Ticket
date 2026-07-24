import { useState } from "react";
import { LogOut, Menu, PlusCircle, UserPlus } from "lucide-react";
import { safiLogoUrl } from "@/assets";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const roleLabel = isAdmin ? "Administrator" : "Officer";

  const runMobileAction = (action: () => void) => {
    setIsMobileMenuOpen(false);
    action();
  };

  return (
    <header className="border-b bg-card/95 shadow-sm">
      <div className="grid w-full gap-3 px-4 py-2 sm:py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center lg:px-6">
        <div className="relative flex min-h-10 min-w-0 items-center justify-center sm:min-h-12 sm:justify-start sm:gap-5">
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
              {roleLabel} - {user.email}
            </p>
          </div>

          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Open navigation menu"
                className="absolute left-0 h-8 w-8 sm:hidden"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[82vw] max-w-80 p-0 sm:hidden">
              <SheetHeader className="border-b px-4 py-3 text-left">
                <SheetTitle className="text-sm font-semibold">Menu</SheetTitle>
              </SheetHeader>

              <div className="border-b px-4 py-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Account</p>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="grid grid-cols-[56px_minmax(0,1fr)] gap-3">
                    <span className="text-xs text-muted-foreground">Name</span>
                    <span className="truncate font-medium text-foreground">{user.name}</span>
                  </div>
                  <div className="grid grid-cols-[56px_minmax(0,1fr)] gap-3">
                    <span className="text-xs text-muted-foreground">Role</span>
                    <span className="text-foreground">{roleLabel}</span>
                  </div>
                  <div className="grid grid-cols-[56px_minmax(0,1fr)] gap-3">
                    <span className="text-xs text-muted-foreground">Email</span>
                    <span className="break-all leading-5 text-foreground">{user.email}</span>
                  </div>
                </div>
              </div>

              <div className="px-2 py-3">
                <p className="px-2 pb-1 text-xs font-semibold uppercase text-muted-foreground">
                  Actions
                </p>
                {isAdmin && (
                  <>
                    <SheetClose asChild>
                      <button
                        type="button"
                        className="flex h-9 w-full items-center gap-2 rounded px-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => runMobileAction(onAddStaff)}
                      >
                        <UserPlus className="h-4 w-4" />
                        Staff
                      </button>
                    </SheetClose>
                    <SheetClose asChild>
                      <button
                        type="button"
                        className="flex h-9 w-full items-center gap-2 rounded px-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => runMobileAction(onNewTicket)}
                      >
                        <PlusCircle className="h-4 w-4" />
                        New ticket
                      </button>
                    </SheetClose>
                  </>
                )}
                {isAdmin && <div className="my-1 border-t" />}
                <SheetClose asChild>
                  <button
                    type="button"
                    className="flex h-9 w-full items-center gap-2 rounded px-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => runMobileAction(onLogout)}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="relative hidden sm:block md:col-start-2">
          <div className="hidden gap-2 sm:flex sm:items-center sm:justify-end">
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
            <Button variant="destructive" size="sm" className="h-9" onClick={onLogout}>
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
