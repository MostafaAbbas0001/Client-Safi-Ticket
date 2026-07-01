import { useEffect, useState, type FormEvent } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import type { User } from "../dashboard-data";

interface NewTicketDialogProps {
  open: boolean;
  user: User;
  onOpenChange: (open: boolean) => void;
  onCreated: (request: {
    title: string;
    body: string;
    requester: string;
    attachments: File[];
  }) => Promise<void>;
}

export function NewTicketDialog({ open, user, onOpenChange, onCreated }: NewTicketDialogProps) {
  const [title, setTitle] = useState("");
  const [requester, setRequester] = useState(user.name);
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (open) {
      setRequester(user.name);
      setError(null);
    }
  }, [open, user.name]);

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

    try {
      setIsCreating(true);
      await onCreated({
        title: title.trim(),
        requester: requester.trim(),
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>New ticket</DialogTitle>
          <DialogDescription>Create a ticket in the helpdesk queue.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-ticket-title">Title</Label>
            <Input
              id="new-ticket-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Brief summary of the issue"
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
            <Label htmlFor="new-ticket-body">Description</Label>
            <Textarea
              id="new-ticket-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Describe the issue..."
              className="min-h-32"
              maxLength={2000}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-ticket-attachments">Attachments</Label>
            <Input
              id="new-ticket-attachments"
              type="file"
              multiple
              onChange={(event) => setAttachments(Array.from(event.target.files ?? []))}
            />
            {attachments.length > 0 && (
              <ul className="space-y-1 text-sm text-muted-foreground">
                {attachments.map((file) => (
                  <li key={`${file.name}-${file.size}`}>{file.name}</li>
                ))}
              </ul>
            )}
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
              {isCreating ? "Creating..." : "Create ticket"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
