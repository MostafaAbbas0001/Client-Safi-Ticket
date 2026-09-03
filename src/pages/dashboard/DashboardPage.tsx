import { useEffect, useMemo, useState } from "react";
import { DashboardHeader } from "./components/DashboardHeader";
import { NewTicketDialog } from "./components/NewTicketDialog";
import { StaffDialog } from "./components/StaffDialog";
import { StatusFilterSection, type StatusFilterItem } from "./components/StatusFilterSection";
import { TicketDrawer } from "./components/TicketDrawer";
import { TicketTableSection } from "./components/TicketTableSection";
import { useDashboardQueries } from "@/queries/dashboard.queries";
import type { TicketDailyOverview } from "@/services/overview.service";
import type { AuthSession } from "@/services/auth.service";
import { ALL_USERS, useDebouncedValue } from "./dashboard-utils";

const EMPTY_DAILY_TICKETS: TicketDailyOverview[] = [];

interface DashboardPageProps {
  session: AuthSession;
  onLogout: () => void;
}

function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCurrentWeekRange() {
  const today = new Date();
  const start = new Date(today);
  const day = today.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;

  start.setDate(today.getDate() - daysSinceMonday);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    startDate: formatDateInputValue(start),
    endDate: formatDateInputValue(end),
  };
}

export function DashboardPage({ session, onLogout }: DashboardPageProps) {
  const currentUser = {
    id: session.userId,
    name: session.name,
    email: session.email,
    role: session.role,
  };
  const [userFilter, setUserFilter] = useState(ALL_USERS);
  const [search, setSearch] = useState("");
  const [statusFilterIds, setStatusFilterIds] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [overviewDateRange, setOverviewDateRange] = useState(getCurrentWeekRange);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [isStaffDialogOpen, setIsStaffDialogOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search);
  const isAdmin = currentUser.role === "admin";
  const userId = userFilter === ALL_USERS ? undefined : Number(userFilter);
  const statusIds = statusFilterIds.length > 0 ? statusFilterIds : undefined;
  const {
    tickets,
    ticketSearch,
    ticketOverview,
    users,
    statuses,
    roles,
    comments,
    attachments,
    isTicketsLoading,
    isTicketsRefreshing,
    isOverviewLoading,
    isCommentsLoading,
    isAttachmentsLoading,
    addTicket,
    addStaffUser,
    assignTicket,
    cancelTicket,
    closeTicket,
    addComment,
    replyToRequester,
    downloadAttachment,
  } = useDashboardQueries({
    currentUser,
    page,
    userId,
    statusIds,
    search: debouncedSearch.trim() || undefined,
    startDate: overviewDateRange.startDate,
    endDate: overviewDateRange.endDate,
    selectedTicketId,
  });
  const dailyTickets = ticketOverview?.dailyTickets ?? EMPTY_DAILY_TICKETS;
  const pageSize = ticketSearch?.pageSize ?? 50;
  const totalCount = ticketSearch?.totalCount ?? tickets.length;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const selectedTicket = tickets.find((ticket) => ticket.id === selectedTicketId) ?? null;

  const statusFilters: StatusFilterItem[] = useMemo(() => {
    if (ticketOverview) {
      return ticketOverview.statuses;
    }

    const fallbackCounts: Record<string, number> = {
      Initiated: 2,
      "In Progress": 2,
      Closed: 19,
      Cancelled: 0,
    };

    return statuses.map((status) => ({ ...status, count: fallbackCounts[status.name] ?? 0 }));
  }, [statuses, ticketOverview]);

  useEffect(() => {
    setPage(1);
  }, [
    debouncedSearch,
    overviewDateRange.endDate,
    overviewDateRange.startDate,
    userFilter,
    statusFilterIds,
  ]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="relative min-h-screen">
        <DashboardHeader
          isAdmin={isAdmin}
          isSidebarCollapsed={isSidebarCollapsed}
          user={currentUser}
          onAddStaff={() => setIsStaffDialogOpen(true)}
          onNewTicket={() => setIsNewTicketOpen(true)}
          onLogout={onLogout}
          onToggleSidebar={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
        />

        <div
          className={`flex min-h-[calc(100vh-64px)] transition-[margin] duration-200 lg:min-h-screen ${
            isSidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-[212px]"
          }`}
        >
          <main className="min-w-0 flex-1 px-4 py-4 lg:px-5">
            <div className={selectedTicket ? "lg:hidden" : undefined}>
              <StatusFilterSection
                statusFilters={statusFilters}
                dailyTickets={dailyTickets}
                totalCount={ticketOverview?.totalCount ?? 0}
                isLoading={isOverviewLoading}
                search={search}
                userFilter={userFilter}
                statusFilterIds={statusFilterIds}
                showUserFilter={isAdmin}
                users={users}
                statuses={statuses}
                startDate={overviewDateRange.startDate}
                endDate={overviewDateRange.endDate}
                onSearchChange={setSearch}
                onUserChange={setUserFilter}
                onStatusChange={setStatusFilterIds}
                onStartDateChange={(startDate) =>
                  setOverviewDateRange((current) => ({ ...current, startDate }))
                }
                onEndDateChange={(endDate) =>
                  setOverviewDateRange((current) => ({ ...current, endDate }))
                }
              />
              <TicketTableSection
                tickets={tickets}
                isAdmin={isAdmin}
                isLoading={isTicketsLoading}
                isRefreshing={isTicketsRefreshing}
                currentUser={currentUser}
                page={page}
                pageCount={pageCount}
                pageSize={pageSize}
                totalCount={totalCount}
                onPageChange={setPage}
                onSelectTicket={(ticket) => setSelectedTicketId(ticket.id)}
              />
            </div>

            <TicketDrawer
              ticket={selectedTicket}
              user={currentUser}
              users={users}
              comments={comments}
              attachments={attachments}
              isCommentsLoading={isCommentsLoading}
              isAttachmentsLoading={isAttachmentsLoading}
              onClose={() => setSelectedTicketId(null)}
              onAssign={assignTicket}
              onCancel={cancelTicket}
              onCloseTicket={closeTicket}
              onAddComment={addComment}
              onReply={replyToRequester}
              onDownloadAttachment={downloadAttachment}
            />
          </main>
        </div>

        <NewTicketDialog
          open={isNewTicketOpen}
          onOpenChange={setIsNewTicketOpen}
          user={currentUser}
          onCreated={addTicket}
        />
        <StaffDialog
          open={isStaffDialogOpen}
          onOpenChange={setIsStaffDialogOpen}
          roles={roles}
          onCreated={addStaffUser}
        />
      </div>
    </div>
  );
}
