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

export const staticUsers: UserLookupItem[] = [];

export const staticTickets: Ticket[] = [];

export const staticComments: TicketComment[] = [];

export const staticAttachments: TicketAttachment[] = [];
