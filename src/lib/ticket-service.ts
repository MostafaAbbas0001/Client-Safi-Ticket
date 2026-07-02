import { apiClient } from "./api-client";
import { ClientCache, createCacheKey } from "./client-cache";
import { overviewService } from "./overview-service";
import type { Ticket, TicketAttachment, TicketComment } from "@/pages/dashboard/dashboard-data";

export interface TicketQuery {
  page?: number;
  statusId?: number;
  userId?: number;
  search?: string;
}

export interface TicketSearchResponse {
  items: Ticket[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface UpdateTicketRequest {
  title?: string;
  body?: string;
  userId?: number | null;
}

export interface CreateTicketRequest {
  title: string;
  body: string;
  requester: string;
}

export interface CreateTicketWithAttachmentsRequest extends CreateTicketRequest {
  attachments?: File[];
}

interface CreatedTicketWithAttachmentsResponse {
  id: number;
  title: string;
  body: string;
  requester: string;
  requesterEmail?: string | null;
  statusId?: number | null;
  userId?: number | null;
  createdAt?: string;
  attachments?: TicketAttachment[];
}

export interface CreateTicketCommentRequest {
  body: string;
  authorName?: string | null;
  authorEmail?: string | null;
  authorType?: string;
  isInternalNote?: boolean;
  userId?: number | null;
}

export interface CreateTicketReplyRequest {
  body: string;
  authorName?: string | null;
  authorEmail?: string | null;
  userId?: number | null;
}

export interface CloseTicketRequest {
  body: string;
  authorName?: string | null;
  authorEmail?: string | null;
  userId?: number | null;
}

const ticketsCache = new ClientCache<TicketSearchResponse>(30 * 1000);
const ticketCache = new ClientCache<Ticket>(60 * 1000);
const commentsCache = new ClientCache<TicketComment[]>(60 * 1000);
const attachmentsCache = new ClientCache<TicketAttachment[]>(5 * 60 * 1000);

function invalidateTicketCaches(ticketId?: number) {
  ticketsCache.clear();
  overviewService.clearCache();

  if (ticketId === undefined) {
    ticketCache.clear();
    commentsCache.clear();
    attachmentsCache.clear();
    return;
  }

  ticketCache.delete(String(ticketId));
  commentsCache.delete(String(ticketId));
  attachmentsCache.delete(String(ticketId));
}

export const ticketService = {
  async getTickets(query: TicketQuery) {
    const response = await ticketsCache.get(createCacheKey(query), () =>
      apiClient.get<TicketSearchResponse>("/api/ticket", { query }),
    );

    return {
      ...response,
      items: Array.isArray(response.items) ? response.items : [],
      page: response.page ?? query.page ?? 1,
      pageSize: response.pageSize ?? 50,
      totalCount: response.totalCount ?? 0,
    };
  },

  getTicket(ticketId: number) {
    return ticketCache.get(String(ticketId), () =>
      apiClient.get<Ticket>(`/api/ticket/${ticketId}`),
    );
  },

  async createTicket(request: CreateTicketRequest) {
    const ticket = await apiClient.post<string>("/api/ticket", request);
    invalidateTicketCaches();
    return ticket;
  },

  async createTicketWithAttachments(request: CreateTicketWithAttachmentsRequest) {
    const formData = new FormData();
    formData.set("title", request.title);
    formData.set("body", request.body);
    formData.set("requester", request.requester);

    request.attachments?.forEach((attachment) => {
      formData.append("attachments", attachment);
    });

    const ticket = await apiClient.post<CreatedTicketWithAttachmentsResponse>(
      "/api/ticket/with-attachments",
      formData,
    );

    invalidateTicketCaches();

    return ticket;
  },

  async updateTicket(ticketId: number, request: UpdateTicketRequest) {
    const ticket = await apiClient.put<Ticket>(`/api/ticket/${ticketId}`, request);
    invalidateTicketCaches(ticketId);
    return ticket;
  },

  async cancelTicket(ticketId: number) {
    const ticket = await apiClient.delete<Ticket>(`/api/ticket/${ticketId}`);
    invalidateTicketCaches(ticketId);
    return ticket;
  },

  async closeTicket(ticketId: number, request: CloseTicketRequest) {
    const ticket = await apiClient.post<Ticket>(`/api/ticket/${ticketId}/close`, request);
    invalidateTicketCaches(ticketId);
    return ticket;
  },

  async getComments(ticketId: number) {
    const comments = await commentsCache.get(String(ticketId), () =>
      apiClient.get<TicketComment[]>(`/api/ticket/${ticketId}/comments`),
    );

    return Array.isArray(comments) ? comments : [];
  },

  async addComment(ticketId: number, request: CreateTicketCommentRequest) {
    const comment = await apiClient.post<TicketComment>(
      `/api/ticket/${ticketId}/comments`,
      request,
    );
    commentsCache.delete(String(ticketId));
    ticketsCache.clear();
    ticketCache.delete(String(ticketId));
    return comment;
  },

  async getAttachments(ticketId: number) {
    const attachments = await attachmentsCache.get(String(ticketId), () =>
      apiClient.get<TicketAttachment[]>(`/api/ticket/${ticketId}/attachments`),
    );

    return Array.isArray(attachments) ? attachments : [];
  },

  async replyToRequester(ticketId: number, request: CreateTicketReplyRequest) {
    const comment = await apiClient.post<TicketComment>(`/api/ticket/${ticketId}/reply`, request);
    commentsCache.delete(String(ticketId));
    ticketsCache.clear();
    ticketCache.delete(String(ticketId));
    return comment;
  },

  clearCache() {
    invalidateTicketCaches();
  },
};
