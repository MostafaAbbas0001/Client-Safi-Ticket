import { useEffect, useState, type FormEvent } from "react";
import { FileText, Paperclip, TicketPlus, X } from "lucide-react";
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
import { Textarea } from "@/components/textarea";
import type { NewTicketDialogProps } from "@/models";

export function NewTicketDialog({ open, user, onOpenChange, onCreated }: NewTicketDialogProps) {
  const [title, setTitle] = useState("");
  const [requester, setRequester] = useState(user.name);
  const [requesterEmail, setRequesterEmail] = useState(user.email);
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (open) {
      setRequester(user.name);
      setRequesterEmail(user.email);
      setError(null);
    }
  }, [open, user.email, user.name]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (title.trim().length < 4) {
      setError("Title must be at least 4 characters.");
      return;
    }

    if (body.trim().length < 10) {
      setError("Description must be at least 10 characters.");
      return;
    }

    if (!requester.trim()) {
      setError("Requester name is required.");
      return;
    }

    if (!requesterEmail.trim()) {
      setError("Requester email is required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requesterEmail.trim())) {
      setError("Requester email is invalid.");
      return;
    }

    try {
      setIsCreating(true);
      await onCreated({
        title: title.trim(),
        requester: requester.trim(),
        requesterEmail: requesterEmail.trim(),
        body: body.trim(),
        attachments,
      });

      setTitle("");
      setBody("");
      setAttachments([]);
      toast.success("Ticket created");
      onOpenChange(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to create ticket.");
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
            <TicketPlus className="h-4 w-4 text-brand" />
            New ticket
          </DialogTitle>
          <DialogDescription>Submit a helpdesk request with supporting details.</DialogDescription>
        </DialogHeader>

        {/* Disabling the whole set while the request is in flight stops
            duplicate submissions and makes the pause self-explanatory. */}
        <form onSubmit={submit}>
          <fieldset
            disabled={isCreating}
            className="m-0 min-w-0 space-y-5 border-0 px-5 py-5 transition-opacity disabled:opacity-60 sm:px-6"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="new-ticket-title">Title</Label>
                <Input
                  id="new-ticket-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Brief summary"
                  maxLength={120}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-ticket-requester">Requester</Label>
                <Input
                  id="new-ticket-requester"
                  value={requester}
                  onChange={(event) => setRequester(event.target.value)}
                  placeholder="Requester name"
                  maxLength={80}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-ticket-requester-email">Requester email</Label>
                <Input
                  id="new-ticket-requester-email"
                  type="email"
                  value={requesterEmail}
                  onChange={(event) => setRequesterEmail(event.target.value)}
                  placeholder="requester@company.com"
                  maxLength={160}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-ticket-body">Description</Label>
              <Textarea
                id="new-ticket-body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Describe the request, impact, and required action."
                className="min-h-32"
                maxLength={2000}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-ticket-attachments" className="flex items-center gap-2">
                <Paperclip className="h-3.5 w-3.5 text-[#63748a]" />
                Attachments
              </Label>
              <Input
                id="new-ticket-attachments"
                type="file"
                multiple
                onChange={(event) => setAttachments(Array.from(event.target.files ?? []))}
              />
              {attachments.length > 0 && (
                <ul className="divide-y divide-[#e2e7ee] rounded-field border border-[#d9e1ea] bg-[#fbfcfe] text-sm text-ink-muted">
                  {attachments.map((file) => (
                    <li
                      key={`${file.name}-${file.size}`}
                      className="flex items-center gap-2 px-3 py-2"
                    >
                      <FileText className="h-3.5 w-3.5 shrink-0 text-ink-muted" />
                      <span className="truncate">{file.name}</span>
                    </li>
                  ))}
                </ul>
              )}
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
              loadingText="Creating ticket..."
              className="w-full"
            >
              <TicketPlus className="h-4 w-4" />
              Create ticket
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
