export interface TicketMessageComposerProps {
  message: string;
  isSendingMessage: boolean;
  isSendingReply: boolean;
  onMessageChange: (message: string) => void;
  onAddInternalNote: () => void;
  onSendReply: () => void;
}
