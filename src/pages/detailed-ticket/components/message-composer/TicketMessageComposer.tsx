import { LockKeyhole, MessageSquareText, SendHorizontal } from "lucide-react";
import { Button } from "@/components/button";
import { Label } from "@/components/label";
import { Textarea } from "@/components/textarea";
import type { TicketMessageComposerProps } from "@/models";

export function TicketMessageComposer({
  message,
  isSendingMessage,
  isSendingReply,
  onMessageChange,
  onAddInternalNote,
  onSendReply,
}: TicketMessageComposerProps) {
  return (
    <div>
      <Label
        htmlFor="ticket-page-message"
        className="flex items-center gap-2 text-[12px] font-semibold text-[#102445]"
      >
        <MessageSquareText className="h-4 w-4 text-[#536a85]" />
        Add to conversation
      </Label>
      <Textarea
        id="ticket-page-message"
        value={message}
        onChange={(event) => onMessageChange(event.target.value)}
        className="mt-3 min-h-28 rounded-[7px] border-[#d9e1ea] text-sm focus-visible:ring-[#146ef5]"
        placeholder="Write an internal note or email reply..."
      />
      <div className="mt-3 grid gap-2 sm:grid-cols-2 sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onAddInternalNote}
          loading={isSendingMessage}
          loadingText="Adding note..."
          disabled={!message.trim() || isSendingReply}
        >
          <LockKeyhole className="h-4 w-4" />
          Add internal note
        </Button>
        <Button
          type="button"
          onClick={onSendReply}
          loading={isSendingReply}
          loadingText="Sending..."
          disabled={!message.trim() || isSendingMessage}
        >
          <SendHorizontal className="h-4 w-4" />
          Send reply
        </Button>
      </div>
    </div>
  );
}
