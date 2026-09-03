import type { CreateTicketWithAttachmentsRequest } from "../ticket-contracts";
import type { User } from "../user";

export interface NewTicketDialogProps {
  open: boolean;
  user: User;
  onOpenChange: (open: boolean) => void;
  onCreated: (request: CreateTicketWithAttachmentsRequest) => Promise<void>;
}
