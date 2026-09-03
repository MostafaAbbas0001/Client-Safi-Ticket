import { MessagesSquare } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/skeleton";
import type { TicketComment, TicketConversationProps } from "@/models";
import { formatDate } from "../../detailed-ticket-utils";
import { EmailBody } from "./EmailBody";

function getCommentPresentation(comment: TicketComment) {
  if (comment.isInternalNote) {
    return {
      label: "Internal note",
      className: "border-l-amber-500 bg-background",
      badgeClassName: "border-amber-300 bg-amber-50 text-amber-800",
    };
  }

  if (comment.authorType.toLowerCase() === "requester") {
    return {
      label: "Requester email",
      className: "border-l-blue-600 bg-background",
      badgeClassName: "border-blue-300 bg-blue-50 text-blue-800",
    };
  }

  return {
    label: "Email reply",
    className: "border-l-emerald-600 bg-background",
    badgeClassName: "border-emerald-300 bg-emerald-50 text-emerald-800",
  };
}

function CommentSkeleton() {
  return (
    <div className="my-2 rounded-[6px] border border-[#dfe5ec] border-l-[3px] border-l-line px-3 py-3">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-4 w-20 rounded-[5px]" />
          </div>
          <Skeleton className="h-2.5 w-36" />
        </div>
        <Skeleton className="h-2.5 w-24" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-2.5 w-full" />
        <Skeleton className="h-2.5 w-[92%]" />
        <Skeleton className="h-2.5 w-[60%]" />
      </div>
    </div>
  );
}

export function TicketConversation({ comments, isLoading }: TicketConversationProps) {
  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#e5eaf0] pb-3">
        <h2 className="flex items-center gap-2 text-[13px] font-semibold text-[#102445]">
          <MessagesSquare className="h-4 w-4 text-[#536a85]" />
          Conversation
        </h2>
        {isLoading ? (
          <Skeleton className="h-[22px] w-16 rounded-[5px]" />
        ) : (
          <span className="rounded-[5px] bg-[#f0f3f7] px-2 py-1 text-[9px] font-semibold text-ink-muted">
            {comments.length} {comments.length === 1 ? "reply" : "replies"}
          </span>
        )}
      </div>
      <div
        className="conversation-scrollbar min-h-0 flex-1 overflow-y-auto pr-2"
        aria-busy={isLoading}
      >
        {isLoading ? (
          <>
            <span className="sr-only">Loading conversation</span>
            <CommentSkeleton />
            <CommentSkeleton />
          </>
        ) : comments.length === 0 ? (
          <EmptyState
            icon={<MessagesSquare />}
            title="No replies yet"
            description="Send an email reply to the requester, or leave an internal note for your team."
          />
        ) : (
          comments.map((comment) => {
            const presentation = getCommentPresentation(comment);

            return (
              <article
                key={comment.id}
                className={`my-2 rounded-[6px] border border-[#dfe5ec] border-l-[3px] px-3 py-3 ${presentation.className}`}
              >
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-[12px] font-semibold text-[#102445]">
                        {comment.authorName || comment.authorType}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-[5px] border px-2 py-0.5 text-[9px] font-semibold ${presentation.badgeClassName}`}
                      >
                        {presentation.label}
                      </span>
                    </div>
                    {comment.authorEmail && (
                      <p className="mt-0.5 truncate text-[10px] text-[#718198]">
                        {comment.authorEmail}
                      </p>
                    )}
                  </div>
                  <time className="shrink-0 text-[10px] text-[#718198]">
                    {formatDate(comment.createdAt)}
                  </time>
                </div>
                <div className="overflow-x-auto text-sm text-[#4a5f78]">
                  <EmailBody value={comment.body} />
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
