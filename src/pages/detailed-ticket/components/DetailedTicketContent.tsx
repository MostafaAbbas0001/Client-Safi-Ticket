import type { DetailedTicketContentProps } from "@/models";
import { TicketActions } from "./actions/TicketActions";
import { TicketAttachments } from "./attachments/TicketAttachments";
import { TicketConversation } from "./conversation/TicketConversation";
import { TicketAssignee, TicketMetadata } from "./details/TicketDetails";
import { TicketMessageComposer } from "./message-composer/TicketMessageComposer";

export function DetailedTicketContent({
  ticket,
  user,
  users,
  comments,
  attachments,
  message,
  draftUserId,
  downloadingAttachmentId,
  isCommentsLoading,
  isAttachmentsLoading,
  isAttachmentsOpen,
  isAssigning,
  isSendingMessage,
  isSendingReply,
  isCancelling,
  isClosing,
  isTerminal,
  onMessageChange,
  onAssign,
  onToggleAttachments,
  onDownloadAttachment,
  onAddInternalNote,
  onSendReply,
  onOpenCloseDialog,
  onCancelTicket,
}: DetailedTicketContentProps) {
  const assigneeControl =
    user.role === "admin" ? (
      <TicketAssignee
        users={users}
        draftUserId={draftUserId}
        isAssigning={isAssigning}
        isTerminal={isTerminal}
        onAssign={onAssign}
      />
    ) : null;

  const actions = (
    <TicketActions
      isAdmin={user.role === "admin"}
      isTerminal={isTerminal}
      isAssigning={isAssigning}
      isClosing={isClosing}
      isCancelling={isCancelling}
      onCloseTicket={onOpenCloseDialog}
      onCancelTicket={onCancelTicket}
    />
  );

  return (
    <>
      {/*
       * Below xl the page scrolls as a whole - conversation history has no
       * fixed height to clip against here, unlike the desktop pane. Only the
       * close/cancel actions stay pinned, since those are the one thing that
       * should always be reachable without hunting through the thread.
       */}
      <div className="flex h-full min-h-0 flex-col xl:hidden">
        <div className="min-h-0 flex-1 divide-y divide-[#e2e7ee] overflow-y-auto px-4">
          {assigneeControl && <section className="py-4">{assigneeControl}</section>}
          <section className="py-4">
            <TicketMetadata ticket={ticket} user={user} />
          </section>
          <section className="py-4">
            <TicketConversation comments={comments} isLoading={isCommentsLoading} />
          </section>
          <section className="py-4">
            <TicketMessageComposer
              message={message}
              isSendingMessage={isSendingMessage}
              isSendingReply={isSendingReply}
              onMessageChange={onMessageChange}
              onAddInternalNote={onAddInternalNote}
              onSendReply={onSendReply}
            />
          </section>
          <section className="py-4">
            <TicketAttachments
              attachments={attachments}
              isLoading={isAttachmentsLoading}
              isOpen={isAttachmentsOpen}
              downloadingAttachmentId={downloadingAttachmentId}
              onToggle={onToggleAttachments}
              onDownload={onDownloadAttachment}
            />
          </section>
        </div>
        <div className="shrink-0 border-t border-[#dfe5ec] bg-surface px-4 py-3">{actions}</div>
      </div>

      <div className="hidden h-full min-h-0 xl:grid xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-h-0 min-w-0 flex-col px-4 py-3">
          <TicketConversation comments={comments} isLoading={isCommentsLoading} />
          <div className="mt-3 shrink-0 border-t border-[#dfe5ec] pt-3">
            <TicketMessageComposer
              message={message}
              isSendingMessage={isSendingMessage}
              isSendingReply={isSendingReply}
              onMessageChange={onMessageChange}
              onAddInternalNote={onAddInternalNote}
              onSendReply={onSendReply}
            />
          </div>
        </div>

        <aside className="min-h-0 overflow-y-auto border-l border-[#dfe5ec] bg-surface-muted px-4 py-3 xl:h-full">
          <section className="border-b border-[#dfe5ec] pb-4">
            <TicketMetadata ticket={ticket} user={user} />
            {assigneeControl && (
              <div className="mt-5 border-t border-[#e5eaf0] pt-4">{assigneeControl}</div>
            )}
          </section>

          <section className="border-b border-[#dfe5ec] py-4">
            <TicketAttachments
              attachments={attachments}
              isLoading={isAttachmentsLoading}
              isOpen={isAttachmentsOpen}
              downloadingAttachmentId={downloadingAttachmentId}
              onToggle={onToggleAttachments}
              onDownload={onDownloadAttachment}
            />
          </section>

          <section className="pt-4">{actions}</section>
        </aside>
      </div>
    </>
  );
}
