export interface TicketActionsProps {
  isAdmin: boolean;
  isTerminal: boolean;
  isAssigning: boolean;
  isClosing: boolean;
  isCancelling: boolean;
  onCloseTicket: () => void;
  onCancelTicket: () => void;
}
