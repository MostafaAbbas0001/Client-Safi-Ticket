import { API_BASE_URL, apiRequest } from "./http";

export type TicketStatus =
  | "New"
  | "Open"
  | "In Progress"
  | "Resolved"
  | "Closed";

export type TicketPriority = "Low" | "Medium" | "High";

export interface Ticket {
  id: number;
  title: string;
  body: string;
  requester: string;

  statusId?: number | null;
  status: string;

  priorityId?: number | null;
  priority: string;

  userId?: number | null;
  assignee?: string | null;

  createdAt?: string;
  commentCount?: number;
  lastCommentAt?: string | null;
}

export interface CreateTicketInput {
  title: string;
  body: string;
  requester: string;
  attachments?: File[];
}

export interface TicketAttachment {
  id: number;
  ticketId: number;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  url: string;
  uploadedAt: string;
}

/**
 * Admin update.
 * Admin can update title/body/status/priority/assignee.
 * This matches backend UpdateTicketRequest:
 * - Title
 * - Body
 * - StatusId
 * - UserId
 * - PriorityId
 */
export interface UpdateTicketInput {
  title?: string;
  body?: string;
  statusId?: number;
  userId?: number | null;
  priorityId?: number;
}

/**
 * Assigned user update.
 * User can only update status/priority/internal note.
 * User cannot change the assigned user.
 */
export interface UserTicketUpdateInput {
  userId: number;
  statusId?: number;
  priorityId?: number;
  internalNote?: string;
}

export interface TicketReplyInput {
  userId?: number;
  body: string;
  authorName?: string;
  authorEmail?: string;
}

export interface TicketCommentInput {
  userId?: number;
  body: string;
  authorName?: string;
  authorEmail?: string;
  authorType?: string;
  isInternalNote?: boolean;
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

export interface TicketSearchParams {
  page?: number;
  pageSize?: number;
  statusId?: number;
  priorityId?: number;
  search?: string;
}

export interface TicketSearchResult {
  items: Ticket[];
  page: number;
  pageSize: number;
  totalCount: number;
  allCount: number;
  activeCount: number;
  pendingCount: number;
  resolvedCount: number;
  closedCount: number;
  statusCounts: Record<number, number>;
}

function normalizeTicket(ticket: any): Ticket {
  return {
    id: ticket.id ?? ticket.ticketId,

    title:
      ticket.title ??
      ticket.Title ??
      "Untitled ticket",

    body:
      ticket.body ??
      ticket.Body ??
      ticket.description ??
      ticket.Description ??
      "",

    requester:
      ticket.requester ??
      ticket.Requester ??
      ticket.requesterName ??
      ticket.RequesterName ??
      ticket.createdBy ??
      "Unknown",

    statusId:
      ticket.statusId ??
      ticket.StatusId ??
      ticket.status?.id ??
      ticket.Status?.Id ??
      null,

    status:
      ticket.statusName ??
      ticket.StatusName ??
      ticket.status?.name ??
      ticket.Status?.Name ??
      ticket.status ??
      ticket.Status ??
      "New",

    priorityId:
      ticket.priorityId ??
      ticket.PriorityId ??
      ticket.priority?.id ??
      ticket.Priority?.Id ??
      null,

    priority:
      ticket.priorityName ??
      ticket.PriorityName ??
      ticket.priority?.name ??
      ticket.Priority?.Name ??
      ticket.priority?.type ??
      ticket.Priority?.Type ??
      ticket.priority ??
      ticket.Priority ??
      "Unassigned",

    userId:
      ticket.userId ??
      ticket.UserId ??
      ticket.assigneeId ??
      ticket.AssigneeId ??
      ticket.user?.id ??
      ticket.User?.Id ??
      null,

    assignee:
      ticket.assignee ??
      ticket.Assignee ??
      ticket.assigneeName ??
      ticket.AssigneeName ??
      ticket.user?.name ??
      ticket.User?.Name ??
      null,

    createdAt:
      ticket.createdAt ??
      ticket.CreatedAt ??
      ticket.createdDate ??
      ticket.CreatedDate ??
      ticket.createdOn ??
      ticket.CreatedOn,

    commentCount:
      ticket.commentCount ??
      ticket.CommentCount ??
      0,

    lastCommentAt:
      ticket.lastCommentAt ??
      ticket.LastCommentAt ??
      null,
  };
}

function normalizeComment(comment: any): TicketComment {
  return {
    id: comment.id ?? comment.commentId,
    ticketId: comment.ticketId,
    body: comment.body ?? comment.Body ?? "",
    authorName: comment.authorName ?? comment.AuthorName ?? null,
    authorEmail: comment.authorEmail ?? comment.AuthorEmail ?? null,
    authorType: comment.authorType ?? comment.AuthorType ?? "User",
    isInternalNote:
      comment.isInternalNote ??
      comment.IsInternalNote ??
      false,
    userId:
      comment.userId ??
      comment.UserId ??
      null,
    createdAt:
      comment.createdAt ??
      comment.CreatedAt ??
      new Date().toISOString(),
  };
}

function normalizeAttachment(attachment: any): TicketAttachment {
  return {
    id: attachment.id ?? attachment.Id,
    ticketId: attachment.ticketId ?? attachment.TicketId,
    fileName: attachment.fileName ?? attachment.FileName ?? "Attachment",
    contentType:
      attachment.contentType ??
      attachment.ContentType ??
      "application/octet-stream",
    sizeBytes: attachment.sizeBytes ?? attachment.SizeBytes ?? 0,
    url: attachment.url ?? attachment.Url ?? "",
    uploadedAt:
      attachment.uploadedAt ??
      attachment.UploadedAt ??
      new Date().toISOString(),
  };
}

function removeUndefinedValues(payload: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  );
}

/**
 * Admin: get all tickets.
 */
export async function getTickets(): Promise<Ticket[]> {
  const tickets = await apiRequest<any[]>("/Ticket");
  return tickets.map(normalizeTicket);
}

export async function searchTickets(
  params: TicketSearchParams = {}
): Promise<TicketSearchResult> {
  const query = new URLSearchParams();

  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  if (params.statusId) query.set("statusId", String(params.statusId));
  if (params.priorityId) query.set("priorityId", String(params.priorityId));
  if (params.search?.trim()) query.set("search", params.search.trim());

  const result = await apiRequest<any>(`/Ticket/search?${query.toString()}`);
  const rawStatusCounts = result.statusCounts ?? result.StatusCounts ?? {};

  return {
    items: (result.items ?? result.Items ?? []).map(normalizeTicket),
    page: result.page ?? result.Page ?? params.page ?? 1,
    pageSize: result.pageSize ?? result.PageSize ?? params.pageSize ?? 50,
    totalCount: result.totalCount ?? result.TotalCount ?? 0,
    allCount: result.allCount ?? result.AllCount ?? 0,
    activeCount: result.activeCount ?? result.ActiveCount ?? 0,
    pendingCount: result.pendingCount ?? result.PendingCount ?? 0,
    resolvedCount: result.resolvedCount ?? result.ResolvedCount ?? 0,
    closedCount: result.closedCount ?? result.ClosedCount ?? 0,
    statusCounts: Object.fromEntries(
      Object.entries(rawStatusCounts).map(([key, value]) => [Number(key), Number(value)]),
    ),
  };
}

/**
 * Assigned user: get only tickets assigned to this user.
 * Backend endpoint:
 * GET /api/Ticket/assigned/{userId}
 */
export async function getAssignedTickets(userId: number): Promise<Ticket[]> {
  const tickets = await apiRequest<any[]>(`/Ticket/assigned/${userId}`);
  return tickets.map(normalizeTicket);
}

export async function getTicketById(ticketId: number): Promise<Ticket> {
  const ticket = await apiRequest<any>(`/Ticket/${ticketId}`);
  return normalizeTicket(ticket);
}

/**
 * Create ticket.
 * Matches backend CreateTicketRequest:
 * - Title
 * - Body
 * - Requester
 */
export async function createTicket(data: CreateTicketInput): Promise<void> {
  if (data.attachments?.length) {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("body", data.body);
    formData.append("requester", data.requester);

    data.attachments.forEach((file) => {
      formData.append("attachments", file);
    });

    const response = await fetch(`${API_BASE_URL}/Ticket/with-attachments`, {
      method: "POST",
      body: formData,
    });

    const text = await response.text();

    if (!response.ok) {
      throw new Error(text || `Request failed: ${response.status} ${response.statusText}`);
    }

    return;
  }

  await apiRequest<string>("/Ticket", {
    method: "POST",
    body: JSON.stringify({
      title: data.title,
      body: data.body,
      requester: data.requester,
    }),
  });
}

export async function getTicketAttachments(
  ticketId: number
): Promise<TicketAttachment[]> {
  const attachments = await apiRequest<any[]>(`/Ticket/${ticketId}/attachments`);
  return attachments.map(normalizeAttachment);
}

export function getAttachmentUrl(attachment: TicketAttachment): string {
  if (/^https?:\/\//i.test(attachment.url)) {
    return attachment.url;
  }

  const staticBaseUrl = API_BASE_URL.replace(/\/api\/?$/i, "");
  return `${staticBaseUrl}${attachment.url}`;
}

/**
 * Admin update.
 * Backend:
 * PUT /api/Ticket/{id}
 *
 * Admin can update:
 * - title
 * - body
 * - statusId
 * - priorityId
 * - userId
 */
export async function updateTicket(
  id: number,
  data: UpdateTicketInput
): Promise<void> {
  const payload = removeUndefinedValues({
    title: data.title,
    body: data.body,
    statusId: data.statusId,
    priorityId: data.priorityId,
    userId: data.userId,
  });

  await apiRequest<string>(`/Ticket/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/**
 * Assigned user update.
 * Backend:
 * PUT /api/Ticket/{ticketId}/user-update
 *
 * User can update:
 * - statusId
 * - priorityId
 * - internalNote
 *
 * User cannot update assignee/userId.
 * userId here is only used by backend to verify ownership.
 */
export async function userUpdateTicket(
  ticketId: number,
  data: UserTicketUpdateInput
): Promise<void> {
  const payload = removeUndefinedValues({
    userId: data.userId,
    statusId: data.statusId,
    priorityId: data.priorityId,
    internalNote: data.internalNote,
  });

  await apiRequest<string>(`/Ticket/${ticketId}/user-update`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/**
 * Delete ticket.
 * Admin-only behavior.
 */
export async function deleteTicket(id: number): Promise<void> {
  await apiRequest<string>(`/Ticket/${id}`, {
    method: "DELETE",
  });
}

/**
 * Get ticket comments.
 */
export async function getTicketComments(
  ticketId: number
): Promise<TicketComment[]> {
  const comments = await apiRequest<any[]>(`/Ticket/${ticketId}/comments`);
  return comments.map(normalizeComment);
}

/**
 * Add a conversation message without sending an email.
 */
export async function addTicketComment(
  ticketId: number,
  data: TicketCommentInput
): Promise<TicketComment> {
  const payload = removeUndefinedValues({
    userId: data.userId,
    body: data.body,
    authorName: data.authorName,
    authorEmail: data.authorEmail,
    authorType: data.authorType ?? "Agent",
    isInternalNote: data.isInternalNote ?? false,
  });

  const comment = await apiRequest<any>(`/Ticket/${ticketId}/comments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return normalizeComment(comment);
}

/**
 * Reply to requester from the system.
 * Backend:
 * POST /api/Ticket/{ticketId}/reply
 *
 * Recommended backend DTO:
 * - UserId
 * - Body
 *
 * authorName/authorEmail are optional. If backend ignores them, no problem.
 */
export async function replyToTicket(
  ticketId: number,
  data: TicketReplyInput
): Promise<TicketComment> {
  const payload = removeUndefinedValues({
    userId: data.userId,
    body: data.body,
    authorName: data.authorName,
    authorEmail: data.authorEmail,
  });

  const comment = await apiRequest<any>(`/Ticket/${ticketId}/reply`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return normalizeComment(comment);
}
