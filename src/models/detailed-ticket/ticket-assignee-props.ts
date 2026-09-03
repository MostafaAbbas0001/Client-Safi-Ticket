import type { UserLookupItem } from "../user-lookup-item";

export interface TicketAssigneeProps {
  users: UserLookupItem[];
  draftUserId: string;
  isAssigning: boolean;
  isTerminal: boolean;
  onAssign: (userId: string) => void;
}
