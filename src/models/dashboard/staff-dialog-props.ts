import type { LookupItem } from "../lookup-item";
import type { CreateUserRequest } from "../user-contracts";

export interface StaffDialogProps {
  open: boolean;
  roles: LookupItem[];
  onOpenChange: (open: boolean) => void;
  onCreated: (request: CreateUserRequest) => Promise<void>;
}
