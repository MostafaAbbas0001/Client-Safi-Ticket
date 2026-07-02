import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { UserLookupItem } from "../dashboard-data";
import { ALL_USERS } from "../dashboard-utils";

interface TicketToolbarProps {
  search: string;
  userFilter: string;
  showUserFilter: boolean;
  users: UserLookupItem[];
  onSearchChange: (value: string) => void;
  onUserChange: (value: string) => void;
}

export function TicketToolbar({
  search,
  userFilter,
  showUserFilter,
  users,
  onSearchChange,
  onUserChange,
}: TicketToolbarProps) {
  return (
    <section className="rounded-lg border bg-card/95 p-4 shadow-[0_16px_45px_rgba(15,15,15,0.05)]">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase text-muted-foreground">Work queue</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-normal">Tickets</h2>
        </div>
      </div>
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by title, ID, requester, or body..."
            className="h-11 bg-background/80 pl-9"
          />
        </div>
        {showUserFilter && (
          <select
            value={userFilter}
            onChange={(event) => onUserChange(event.target.value)}
            className="h-11 rounded-md border border-input bg-background/80 px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring lg:w-60"
          >
            <option value={ALL_USERS}>All users</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        )}
      </div>
    </section>
  );
}
