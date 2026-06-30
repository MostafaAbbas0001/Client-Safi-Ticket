import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { createTicket } from "../api/ticketApi";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/create-ticket")({
  head: () => ({ meta: [{ title: "New Ticket — Helpdesk" }] }),
  component: CreateTicketPage,
});

function CreateTicketPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requester, setRequester] = useState(user?.name ?? "");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || title.trim().length < 4) {
      setError("Title must be at least 4 characters.");
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setError("Description must be at least 10 characters.");
      return;
    }
    if (!requester.trim()) {
      setError("Requester name is required.");
      return;
    }

    try {
      setSubmitting(true);

      await createTicket({
        title: title.trim(),
        body: description.trim(),
        requester: requester.trim(),
        attachments,
      });

      toast.success("Ticket submitted");
      navigate({ to: user?.role === "admin" ? "/admin" : "/officer" });
    } catch (err) {
      console.error("Failed to submit ticket:", err);
      setError(err instanceof Error ? err.message : "Failed to submit ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Submit a new ticket</h2>
        <p className="text-sm text-muted-foreground">
          Provide as much detail as possible to help our team resolve the issue.
        </p>
      </div>

      <Card className="rounded-xl">
        <CardContent className="p-6">
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary of the issue"
                maxLength={120}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requester">Requester name</Label>
              <Input
                id="requester"
                value={requester}
                onChange={(e) => setRequester(e.target.value)}
                placeholder="Your name"
                maxLength={80}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What happened? What did you expect?"
                rows={5}
                maxLength={2000}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="attachments">Attachments</Label>
              <Input
                id="attachments"
                type="file"
                multiple
                onChange={(event) =>
                  setAttachments(Array.from(event.target.files ?? []))
                }
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

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => navigate({ to: ".." as any })}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit ticket"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
