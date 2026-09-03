import { useState, type FormEvent } from "react";
import { UserRoundPlus, X } from "lucide-react";
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
import type { LookupItem } from "@/models/ticket";
import type { CreateUserRequest } from "@/services/user.service";

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

    if (roles.length === 0) {
      setError("Roles are not available yet.");
      return;
    }

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
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isCreating) onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserRoundPlus className="h-4 w-4 text-brand" />
            Add staff user
          </DialogTitle>
          <DialogDescription>Create an internal helpdesk account.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <fieldset
            disabled={isCreating}
            className="m-0 min-w-0 space-y-4 border-0 p-0 transition-opacity disabled:opacity-60"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="staff-name">Name</Label>
                <Input
                  id="staff-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
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
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="staff-role">Role</Label>
                <select
                  id="staff-role"
                  value={roleId}
                  onChange={(event) => setRoleId(event.target.value)}
                  className="h-10 w-full cursor-pointer rounded-field border border-[#d9e1ea] bg-surface px-3 py-2 text-sm text-ink outline-none transition-[border-color,box-shadow] hover:border-[#c5d1dd] focus:border-brand focus:ring-2 focus:ring-brand-ring disabled:cursor-not-allowed disabled:bg-[#f4f6f8] disabled:opacity-60"
                  disabled={roles.length === 0}
                >
                  <option value="" disabled>
                    {roles.length === 0 ? "No roles available" : "Select role"}
                  </option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-field bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </p>
            )}
          </fieldset>

          <DialogFooter className="!grid grid-cols-1 gap-2 sm:grid-cols-2 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
              className="w-full"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isCreating}
              loadingText="Creating account..."
              className="w-full"
            >
              <UserRoundPlus className="h-4 w-4" />
              Create staff user
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
