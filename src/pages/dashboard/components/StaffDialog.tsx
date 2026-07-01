import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LookupItem } from "../dashboard-data";
import type { CreateUserRequest } from "@/lib/user-service";

interface StaffDialogProps {
  open: boolean;
  roles: LookupItem[];
  onOpenChange: (open: boolean) => void;
  onCreated: (request: CreateUserRequest) => Promise<void>;
}

export function StaffDialog({ open, roles, onOpenChange, onCreated }: StaffDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !phoneNumber.trim() || !password || !roleId) {
      setError("All staff fields are required.");
      return;
    }

    try {
      setIsCreating(true);
      await onCreated({
        name: name.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        password,
        roleId: Number(roleId),
      });

      setName("");
      setEmail("");
      setPhoneNumber("");
      setPassword("");
      setRoleId("");
      toast.success("Staff user created");
      onOpenChange(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to create staff user.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add staff user</DialogTitle>
          <DialogDescription>Create a staff account for the helpdesk.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="staff-name">Name</Label>
            <Input id="staff-name" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-email">Email</Label>
            <Input
              id="staff-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-phone">Phone number</Label>
            <Input
              id="staff-phone"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-password">Password</Label>
            <Input
              id="staff-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-role">Role</Label>
            <select
              id="staff-role"
              value={roleId}
              onChange={(event) => setRoleId(event.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="" disabled>
                Select role
              </option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Creating..." : "Create staff user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
