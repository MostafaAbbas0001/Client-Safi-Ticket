import { useEffect, useRef, useState, type FormEvent } from "react";
import { Check, UserRoundPlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/dialog";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { MENU_OPTION, MENU_OPTION_ACTIVE, MenuField } from "@/components/menu-field";
import type { StaffDialogProps } from "@/models";

export function StaffDialog({ open, roles, onOpenChange, onCreated }: StaffDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("");
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const roleFieldRef = useRef<HTMLDivElement>(null);
  const selectedRole = roles.find((role) => String(role.id) === roleId);

  useEffect(() => {
    if (!isRoleMenuOpen) return;

    const closeRoleMenu = (event: MouseEvent) => {
      if (!roleFieldRef.current?.contains(event.target as Node)) setIsRoleMenuOpen(false);
    };

    document.addEventListener("mousedown", closeRoleMenu);
    return () => document.removeEventListener("mousedown", closeRoleMenu);
  }, [isRoleMenuOpen]);

  useEffect(() => {
    if (!open) setIsRoleMenuOpen(false);
  }, [open]);

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
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserRoundPlus className="h-4 w-4 text-brand" />
            Add staff user
          </DialogTitle>
          <DialogDescription>Create an internal helpdesk account.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit}>
          <fieldset
            disabled={isCreating}
            className="m-0 min-w-0 space-y-5 border-0 px-5 py-5 transition-opacity disabled:opacity-60 sm:px-6"
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
                <MenuField
                  id="staff-role"
                  value={
                    selectedRole?.name ??
                    (roles.length === 0 ? "No roles available" : "Select role")
                  }
                  open={isRoleMenuOpen}
                  onToggle={() => setIsRoleMenuOpen((current) => !current)}
                  fieldRef={roleFieldRef}
                  disabled={roles.length === 0}
                  menuClassName="bottom-full top-auto mb-1.5 mt-0"
                >
                  {roles.map((role) => {
                    const isSelected = String(role.id) === roleId;

                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => {
                          setRoleId(String(role.id));
                          setIsRoleMenuOpen(false);
                        }}
                        className={`${MENU_OPTION} ${isSelected ? MENU_OPTION_ACTIVE : ""}`}
                      >
                        <span>{role.name}</span>
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                      </button>
                    );
                  })}
                </MenuField>
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

          <DialogFooter className="!grid grid-cols-1 sm:grid-cols-2">
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
