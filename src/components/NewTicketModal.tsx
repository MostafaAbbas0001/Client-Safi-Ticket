import { useState, type FormEvent } from "react";
import { createTicket } from "../api/ticketApi";

interface NewTicketModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
}

export function NewTicketModal({
  open,
  onClose,
  onCreated,
}: NewTicketModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requesterName, setRequesterName] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    if (!description.trim()) {
      setError("Description is required.");
      return;
    }

    if (!requesterName.trim()) {
      setError("Requester is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await createTicket({
        title: title.trim(),
        body: description.trim(),
        requester: requesterName.trim(),
        attachments,
      });

      setTitle("");
      setDescription("");
      setRequesterName("");
      setAttachments([]);

      await onCreated();
      onClose();
    } catch (err) {
      console.error("Failed to create ticket:", err);
      setError(err instanceof Error ? err.message : "Failed to create ticket.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">New ticket</h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-muted-foreground hover:bg-muted"
          >
            x
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Title</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
              placeholder="Example: Laptop not working"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Requester</label>
            <input
              value={requesterName}
              onChange={(event) => setRequesterName(event.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
              placeholder="Example: Najeeb Darwish"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Description
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-28 w-full rounded-lg border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
              placeholder="Describe the issue..."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Attachments</label>
            <input
              type="file"
              multiple
              onChange={(event) =>
                setAttachments(Array.from(event.target.files ?? []))
              }
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
            {attachments.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {attachments.map((file) => (
                  <li key={`${file.name}-${file.size}`}>{file.name}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 font-medium hover:bg-muted"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Creating..." : "Create ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
