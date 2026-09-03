import { apiClient } from "./api-client";
import type {
  CloseTicketRequest,
  CreateTicketCommentRequest,
  CreateTicketReplyRequest,
  CreateTicketRequest,
  CreatedTicketWithAttachmentsResponse,
  CreateTicketWithAttachmentsRequest,
  Ticket,
  TicketAttachment,
  TicketComment,
  TicketQuery,
  TicketSearchResponse,
  UpdateTicketRequest,
} from "@/models";

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

  createTicketWithAttachments(request: CreateTicketWithAttachmentsRequest) {
    const formData = new FormData();
    formData.set("title", request.title);
    formData.set("body", request.body);
    formData.set("requester", request.requester);
    formData.set("requesterEmail", request.requesterEmail);
    request.attachments?.forEach((attachment) => formData.append("attachments", attachment));

    return apiClient.post<CreatedTicketWithAttachmentsResponse>(
      "/api/ticket/with-attachments",
      formData,
    );
  },

  updateTicket(ticketId: number, request: UpdateTicketRequest) {
    return apiClient.put<Ticket>(`/api/ticket/${ticketId}`, request);
  },

  cancelTicket(ticketId: number) {
    return apiClient.delete<Ticket>(`/api/ticket/${ticketId}`);
  },

  closeTicket(ticketId: number, request: CloseTicketRequest) {
    return apiClient.post<Ticket>(`/api/ticket/${ticketId}/close`, request);
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

  markRequesterRepliesAsRead(ticketId: number) {
    return apiClient.post<void>(`/api/ticket/${ticketId}/read`);
  },

  downloadAttachment(attachment: TicketAttachment) {
    const path = attachment.downloadUrl?.trim() || `/api/ticket/attachments/${attachment.id}/file`;
    return apiClient.download(path);
  },
};
