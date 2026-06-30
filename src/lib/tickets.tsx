import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  SEED_TICKETS,
  type Ticket,
  type TicketComment,
  type TicketPriority,
  type TicketStatus,
} from "./mock-data";

const STORAGE_KEY = "ticketing.tickets.v1";

interface TicketContextValue {
  tickets: Ticket[];
  getTicket: (id: string) => Ticket | undefined;
  createTicket: (input: { title: string; description: string; requester: string; priority: TicketPriority }) => Ticket;
  assignOfficer: (id: string, officerId: string) => void;
  updateStatus: (id: string, status: TicketStatus) => void;
  updatePriority: (id: string, priority: TicketPriority) => void;
  addComment: (id: string, author: string, text: string) => void;
}

const TicketContext = createContext<TicketContextValue | null>(null);

function loadInitial(): Ticket[] {
  if (typeof window === "undefined") return SEED_TICKETS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return SEED_TICKETS;
}

export function TicketProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>(SEED_TICKETS);

  useEffect(() => {
    setTickets(loadInitial());
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
    } catch {}
  }, [tickets]);

  const nextId = () => {
    const max = tickets.reduce((m, t) => {
      const n = parseInt(t.id.replace(/\D/g, ""), 10);
      return Number.isFinite(n) && n > m ? n : m;
    }, 1000);
    return `TKT-${max + 1}`;
  };

  const value: TicketContextValue = {
    tickets,
    getTicket: (id) => tickets.find((t) => t.id === id),
    createTicket: ({ title, description, requester, priority }) => {
      const ticket: Ticket = {
        id: nextId(),
        title,
        description,
        requester,
        priority,
        status: "New",
        assignedOfficerId: null,
        createdAt: new Date().toISOString(),
        comments: [],
      };
      setTickets((prev) => [ticket, ...prev]);
      return ticket;
    },
    assignOfficer: (id, officerId) => {
      setTickets((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, assignedOfficerId: officerId, status: t.status === "New" ? "Open" : t.status }
            : t,
        ),
      );
    },
    updateStatus: (id, status) => {
      setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    },
    updatePriority: (id, priority) => {
      setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, priority } : t)));
    },
    addComment: (id, author, text) => {
      const c: TicketComment = {
        id: `c-${Date.now()}`,
        author,
        text,
        createdAt: new Date().toISOString(),
      };
      setTickets((prev) =>
        prev.map((t) => (t.id === id ? { ...t, comments: [...t.comments, c] } : t)),
      );
    },
  };

  return <TicketContext.Provider value={value}>{children}</TicketContext.Provider>;
}

export function useTickets() {
  const ctx = useContext(TicketContext);
  if (!ctx) throw new Error("useTickets must be used within TicketProvider");
  return ctx;
}