export interface CloseTicketDialogProps {
  ticketId: number;
  open: boolean;
  message: string;
  isClosing: boolean;
  onOpenChange: (open: boolean) => void;
  onMessageChange: (message: string) => void;
  onConfirm: () => void;
}
