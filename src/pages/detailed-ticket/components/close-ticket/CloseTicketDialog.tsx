import { CircleCheckBig, X } from "lucide-react";
import { Button } from "@/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/dialog";
import { Label } from "@/components/label";
import { Textarea } from "@/components/textarea";
import type { CloseTicketDialogProps } from "@/models";

export function CloseTicketDialog({
  ticketId,
  open,
  message,
  isClosing,
  onOpenChange,
  onMessageChange,
  onConfirm,
}: CloseTicketDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isClosing && onOpenChange(nextOpen)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CircleCheckBig className="h-4 w-4 text-success" />
            Close TK-{ticketId}
          </DialogTitle>
          <DialogDescription>
            Add an optional final message, or leave it empty to send the default closed-ticket
            email.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 px-5 py-5 sm:px-6">
          <Label htmlFor="closing-message">Closing message</Label>
          <Textarea
            id="closing-message"
            value={message}
            onChange={(event) => onMessageChange(event.target.value)}
            className="min-h-32"
            placeholder="Optional resolution message..."
            disabled={isClosing}
          />
        </div>
        <DialogFooter className="!grid grid-cols-1 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isClosing}
            className="w-full"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button
            type="button"
            variant="success"
            onClick={onConfirm}
            loading={isClosing}
            loadingText="Closing..."
            className="w-full"
          >
            <CircleCheckBig className="h-4 w-4" />
            Close Ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
