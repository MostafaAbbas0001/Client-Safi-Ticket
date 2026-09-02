export type Role = "admin" | "officer";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface LookupItem {
  id: number;
  name: string;
}

export interface UserLookupItem {
  id: number;
  name: string;
  email?: string;
}

export interface Ticket {
  id: number;
  title: string;
  body: string;
  requester: string;
  requesterEmail?: string | null;
  statusId?: number | null;
  status: string;
  userId?: number | null;
  assignee?: string | null;
  createdAt?: string;
  commentCount?: number;
  lastCommentAt?: string | null;
}

export interface TicketComment {
  id: number;
  ticketId: number;
  body: string;
  authorName?: string | null;
  authorEmail?: string | null;
  authorType: string;
  isInternalNote: boolean;
  userId?: number | null;
  createdAt: string;
}

export interface TicketAttachment {
  id: number;
  ticketId: number;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  url: string;
  downloadUrl?: string;
  uploadedAt: string;
}

export const staticUsers: UserLookupItem[] = [
  { id: 1, name: "Mostafa Abbas", email: "mostafa.abbas@saficos.com" },
  { id: 2, name: "Khoder Kurdy", email: "khoder.kurdy@saficos.com" },
];

export const staticTickets: Ticket[] = [
  {
    id: 188,
    title: "Adding staff name",
    body: "Please add the name Waad wesam Al-Khamis to the HOS Khairan Mall system",
    requester: "Hazem Al Mhanna",
    requesterEmail: "Hazem.Almhanna@saficos.com",
    statusId: 3,
    status: "Closed",
    userId: 1,
    assignee: "Mostafa Abbas",
    createdAt: "2026-09-02T11:49:00",
    commentCount: 2,
  },
  {
    id: 187,
    title: "Re: sara ramadan",
    body: "Hello, Please adjust order number LB6604 Replace B01013694 B S Hair Mist...",
    requester: "Zahraa Karnib",
    statusId: 3,
    status: "Closed",
    userId: 1,
    assignee: "Mostafa Abbas",
    createdAt: "2026-09-02T08:34:00",
  },
  {
    id: 186,
    title: "Fw: change salesman invoice",
    body: "Please change salesman report name Camille Rose De Jesus to Lian Pearl B...",
    requester: "Hazem Al Mhanna",
    statusId: 2,
    status: "In Progress",
    userId: 2,
    assignee: "Khoder Kurdy",
    createdAt: "2026-09-01T19:44:00",
  },
  {
    id: 185,
    title: "FW: Invoices required",
    body: "Hi Khoder and Team, As per the customer's request, please update the cus...",
    requester: "Saber Abdul Kadir Mahadik",
    statusId: 1,
    status: "Initiated",
    userId: null,
    assignee: null,
    createdAt: "2026-09-01T16:44:00",
  },
  {
    id: 184,
    title: "website order adjustment",
    body: "Hello, Please update order number LB6576 Replace B01013694 B S Hair Mist...",
    requester: "Zahraa Karnib",
    statusId: 3,
    status: "Closed",
    userId: 1,
    assignee: "Mostafa Abbas",
    createdAt: "2026-09-01T16:20:00",
  },
  {
    id: 183,
    title: "Request to Change Refund Method",
    body: "Dear IT Team, I would like to request a change to the refund method for ...",
    requester: "Elio Safi",
    statusId: 3,
    status: "Closed",
    userId: 1,
    assignee: "Mostafa Abbas",
    createdAt: "2026-09-01T15:36:00",
  },
  {
    id: 182,
    title: "Mostafa Taher email to Yazan",
    body: "Hi Kindly add the mailbox of Mostafa taher to Yazan for business needs. ...",
    requester: "Razan Hijazi",
    statusId: 3,
    status: "Closed",
    userId: 1,
    assignee: "Mostafa Abbas",
    createdAt: "2026-09-01T14:34:00",
  },
  {
    id: 181,
    title: "FW: NetSuite CSV Import (Invoices LEB)",
    body: "Dear Mostafa, Kindly note that DT sales for downtown 31/8/2026",
    requester: "Nisrine Fakhreddine",
    statusId: 3,
    status: "Closed",
    userId: 1,
    assignee: "Mostafa Abbas",
    createdAt: "2026-09-01T13:41:00",
  },
];

export const staticComments: TicketComment[] = [
  {
    id: 1,
    ticketId: 188,
    body: "Please add the name Waad wesam Al-Khamis to the HOS Khairan Mall system",
    authorName: "Hazem Al Mhanna",
    authorEmail: "Hazem.Almhanna@saficos.com",
    authorType: "Requester",
    isInternalNote: false,
    createdAt: "2026-09-02T11:49:36",
  },
  {
    id: 2,
    ticketId: 188,
    body: "Added, log out and log in again to reflect the changes",
    authorName: "Mostafa Abbas",
    authorEmail: "mostafa.abbas@saficos.com",
    authorType: "Agent",
    isInternalNote: false,
    userId: 1,
    createdAt: "2026-09-02T12:05:46",
  },
];

export const staticAttachments: TicketAttachment[] = [];
