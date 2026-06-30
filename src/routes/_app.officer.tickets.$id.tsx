import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Paperclip } from "lucide-react";
import {
  getAttachmentUrl,
  getTicketAttachments,
  getTicketById,
  getTicketComments,
  type Ticket,
  type TicketAttachment,
  type TicketComment,
} from "@/api/ticketApi";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/officer/tickets/$id")({
  component: OfficerTicketDetail,
});

function formatAttachmentSize(sizeBytes: number) {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  return `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`;
}

function OfficerTicketDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const ticketId = Number(id);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTicket() {
      if (!Number.isFinite(ticketId)) {
        setError("Invalid ticket id.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const [ticketData, ticketComments, ticketAttachments] = await Promise.all([
          getTicketById(ticketId),
          getTicketComments(ticketId),
          getTicketAttachments(ticketId),
        ]);
        setTicket(ticketData);
        setComments(ticketComments);
        setAttachments(ticketAttachments);
      } catch (err) {
        console.error("Failed to load ticket:", err);
        setError(err instanceof Error ? err.message : "Failed to load ticket.");
      } finally {
        setLoading(false);
      }
    }

    void loadTicket();
  }, [ticketId]);

  if (loading) {
    return <Card><CardContent className="p-8 text-center text-muted-foreground">Loading ticket...</CardContent></Card>;
  }

  if (error || !ticket) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate({ to: "/officer" })}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Card><CardContent className="p-8 text-center text-muted-foreground">{error || "Ticket not found."}</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link to="/officer" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to my tickets
      </Link>

      <Card className="rounded-xl">
        <CardContent className="space-y-5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs text-muted-foreground">TK-{String(ticket.id).padStart(4, "0")}</p>
              <h2 className="mt-1 text-xl font-semibold">{ticket.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Requested by {ticket.requester} - {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : "-"}
              </p>
            </div>
            <div className="flex gap-2">
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priorityId ? ticket.priority : "Unassigned"} />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Body</h3>
            <div className="min-h-32 whitespace-pre-wrap rounded-lg border bg-muted/30 p-4 text-sm leading-6">
              {ticket.body?.trim() || "No body provided."}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="flex items-center gap-2 font-semibold">
              <Paperclip className="h-4 w-4" />
              Attachments
            </h3>
            {attachments.length === 0 ? (
              <p className="rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">No attachments.</p>
            ) : (
              <ul className="space-y-2 rounded-lg border bg-muted/20 p-3">
                {attachments.map((attachment) => (
                  <li key={attachment.id}>
                    <a
                      href={getAttachmentUrl(attachment)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2 text-sm hover:bg-muted"
                    >
                      <span className="truncate font-medium">{attachment.fileName}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatAttachmentSize(attachment.sizeBytes)}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Conversation</h3>
            {comments.length === 0 ? (
              <p className="rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">No replies yet.</p>
            ) : (
              <ul className="space-y-3 rounded-lg border bg-muted/20 p-3">
                {comments.map((comment) => (
                  <li key={comment.id} className="rounded-lg bg-white p-3 text-sm">
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <span className="font-medium">{comment.authorName || comment.authorType}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-muted-foreground">{comment.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
