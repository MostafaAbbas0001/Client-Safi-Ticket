export type Role = "admin" | "officer";

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: Role;
}

export type TicketStatus = "New" | "Open" | "In Progress" | "Resolved" | "Closed";
export type TicketPriority = "Low" | "Medium" | "High";

export interface TicketComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  requester: string;
  createdAt: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignedOfficerId: string | null;
  comments: TicketComment[];
}

export const USERS: User[] = [
  { id: "u-admin", username: "admin", password: "admin", name: "Alex Admin", role: "admin" },
  { id: "u-off-1", username: "sara", password: "sara", name: "Sara Okafor", role: "officer" },
  { id: "u-off-2", username: "ben", password: "ben", name: "Ben Tanaka", role: "officer" },
  { id: "u-off-3", username: "mia", password: "mia", name: "Mia Hernandez", role: "officer" },
];

export const OFFICERS = USERS.filter((u) => u.role === "officer");

export const SEED_TICKETS: Ticket[] = [
  {
    id: "TKT-1001",
    title: "Cannot log into company portal",
    description: "Getting a 500 error after entering credentials on the SSO page.",
    requester: "Jordan Lee",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    priority: "High",
    status: "New",
    assignedOfficerId: null,
    comments: [],
  },
  {
    id: "TKT-1002",
    title: "Printer on 3rd floor offline",
    description: "HP LaserJet near reception is not responding to print jobs since this morning.",
    requester: "Priya Sharma",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    priority: "Medium",
    status: "Open",
    assignedOfficerId: "u-off-1",
    comments: [
      {
        id: "c-1",
        author: "Sara Okafor",
        text: "I'll check the network queue and reach out shortly.",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
      },
    ],
  },
  {
    id: "TKT-1003",
    title: "Request new Figma seat",
    description: "Need an editor seat assigned to the design team.",
    requester: "Marcus Wright",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
    priority: "Low",
    status: "In Progress",
    assignedOfficerId: "u-off-2",
    comments: [],
  },
  {
    id: "TKT-1004",
    title: "VPN keeps disconnecting",
    description: "Drops every 10 minutes from home network.",
    requester: "Elena Rossi",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    priority: "High",
    status: "Resolved",
    assignedOfficerId: "u-off-1",
    comments: [
      {
        id: "c-2",
        author: "Sara Okafor",
        text: "Pushed updated VPN profile; user confirmed stable connection.",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
      },
    ],
  },
  {
    id: "TKT-1005",
    title: "Add new hire to email group",
    description: "Please add Chen Liu to the engineering@ distribution list.",
    requester: "HR Team",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    priority: "Low",
    status: "New",
    assignedOfficerId: null,
    comments: [],
  },
  {
    id: "TKT-1006",
    title: "Laptop running slow after update",
    description: "Following the latest OS update everything takes ages to open.",
    requester: "Thomas Becker",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 100).toISOString(),
    priority: "Medium",
    status: "Closed",
    assignedOfficerId: "u-off-3",
    comments: [],
  },
];