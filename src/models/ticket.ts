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
  hasUnreadRequesterReply?: boolean;
  unreadRequesterReplyCount?: number;
  lastRequesterReplyAt?: string | null;
}
