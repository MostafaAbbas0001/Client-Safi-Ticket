import { CircleCheckBig, CircleX } from "lucide-react";
import { Button } from "@/components/button";
import type { TicketActionsProps } from "@/models";

export function TicketActions({
  isAdmin,
  isTerminal,
  isAssigning,
  isClosing,
  isCancelling,
  onCloseTicket,
  onCancelTicket,
}: TicketActionsProps) {
  return (
    <div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
        <Button
          type="button"
          variant="success"
          onClick={onCloseTicket}
          disabled={isTerminal || isAssigning || isClosing || isCancelling}
          className="w-full"
        >
          <CircleCheckBig className="h-4 w-4" />
          Close Ticket
        </Button>
        {isAdmin && (
          <Button
            type="button"
            variant="destructive"
            onClick={onCancelTicket}
            loading={isCancelling}
            loadingText="Cancelling..."
            disabled={isTerminal || isAssigning || isClosing}
            className="w-full"
          >
            <CircleX className="h-4 w-4" />
            Cancel Ticket
          </Button>
        )}
      </div>
    </div>
  );
}
