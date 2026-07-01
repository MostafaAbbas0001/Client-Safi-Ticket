import { apiClient } from "./api-client";
import type { Ticket, TicketAttachment, TicketComment } from "@/pages/dashboard/dashboard-data";

export interface TicketQuery {
  page?: number;
  statusId?: number;
  priorityId?: number;
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
  statusId?: number | null;
  priorityId?: number | null;
  userId?: number | null;
  actorUserId?: number;
  internalNote?: string;
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
  priorityId?: number | null;
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

export const ticketService = {
  async getTickets(query: TicketQuery) {
    const response = await apiClient.get<TicketSearchResponse>("/api/ticket", { query });

    return {
      ...response,
      items: Array.isArray(response.items) ? response.items : [],
      page: response.page ?? query.page ?? 1,
      pageSize: response.pageSize ?? 50,
      totalCount: response.totalCount ?? 0,
    };
  },

  getTicket(ticketId: number) {
    return apiClient.get<Ticket>(`/api/ticket/${ticketId}`);
  },

  createTicket(request: CreateTicketRequest) {
    return apiClient.post<string>("/api/ticket", request);
  },

  async createTicketWithAttachments(request: CreateTicketWithAttachmentsRequest) {
    const formData = new FormData();
    formData.set("title", request.title);
    formData.set("body", request.body);
    formData.set("requester", request.requester);

    request.attachments?.forEach((attachment) => {
      formData.append("attachments", attachment);
    });

    return apiClient.post<CreatedTicketWithAttachmentsResponse>(
      "/api/ticket/with-attachments",
      formData,
    );
  },

  updateTicket(ticketId: number, request: UpdateTicketRequest) {
    return apiClient.put<string>(`/api/ticket/${ticketId}`, request);
  },

  deleteTicket(ticketId: number) {
    return apiClient.delete<string>(`/api/ticket/${ticketId}`);
  },

  async getComments(ticketId: number) {
    const comments = await apiClient.get<TicketComment[]>(`/api/ticket/${ticketId}/comments`);

    return Array.isArray(comments) ? comments : [];
  },

  addComment(ticketId: number, request: CreateTicketCommentRequest) {
    return apiClient.post<TicketComment>(`/api/ticket/${ticketId}/comments`, request);
  },

  async getAttachments(ticketId: number) {
    const attachments = await apiClient.get<TicketAttachment[]>(
      `/api/ticket/${ticketId}/attachments`,
    );

    return Array.isArray(attachments) ? attachments : [];
  },

  replyToRequester(ticketId: number, request: CreateTicketReplyRequest) {
    return apiClient.post<TicketComment>(`/api/ticket/${ticketId}/reply`, request);
  },
};
