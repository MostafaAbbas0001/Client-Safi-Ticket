import type { TicketOverviewQuery } from "@/services/overview.service";
import type { TicketQuery } from "@/services/ticket.service";

export const queryKeys = {
  tickets: {
    all: ["tickets"] as const,
    lists: () => ["tickets", "list"] as const,
    list: (query: TicketQuery) => ["tickets", "list", query] as const,
    details: () => ["tickets", "detail"] as const,
    detail: (ticketId: number) => ["tickets", "detail", ticketId] as const,
    comments: (ticketId: number) => ["tickets", "comments", ticketId] as const,
    attachments: (ticketId: number) => ["tickets", "attachments", ticketId] as const,
  },
  overview: {
    all: ["overview"] as const,
    tickets: (query: TicketOverviewQuery) => ["overview", "tickets", query] as const,
  },
  users: {
    all: ["users"] as const,
  },
  statuses: {
    all: ["statuses"] as const,
  },
  roles: {
    all: ["roles"] as const,
  },
};
