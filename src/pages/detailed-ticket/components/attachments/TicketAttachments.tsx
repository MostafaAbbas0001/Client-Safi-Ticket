import { ChevronDown, Download, Paperclip } from "lucide-react";
import { Skeleton } from "@/components/skeleton";
import { Spinner } from "@/components/spinner";
import type { TicketAttachmentsProps } from "@/models";
import { formatAttachmentSize } from "../../detailed-ticket-utils";

function AttachmentSkeleton() {
  return (
    <ul className="divide-y divide-[#e2e7ee] rounded-field border border-[#dfe5ec]">
      {Array.from({ length: 2 }, (_, index) => (
        <li key={index} className="flex min-h-11 items-center justify-between gap-2 px-3 py-2">
          <Skeleton className="h-2.5 w-[60%]" />
          <Skeleton className="h-3 w-3 rounded-full" />
        </li>
      ))}
    </ul>
  );
}

export function TicketAttachments({
  attachments,
  isLoading,
  isOpen,
  downloadingAttachmentId,
  onToggle,
  onDownload,
}: TicketAttachmentsProps) {
  return (
    <div>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="ticket-page-attachments"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="flex items-center gap-2 text-[12px] font-semibold text-[#102445]">
          <Paperclip className="h-4 w-4 text-[#536a85]" />
          Attachments
          {isLoading ? (
            <Skeleton className="h-4 w-6 rounded-[4px]" />
          ) : (
            <span className="rounded-[4px] bg-[#e9eef4] px-2 py-0.5 text-[9px] text-ink-muted">
              {attachments.length}
            </span>
          )}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-ink-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div id="ticket-page-attachments" className="mt-3">
          {isLoading ? (
            <AttachmentSkeleton />
          ) : attachments.length === 0 ? (
            <p className="rounded-field border border-dashed border-[#d9e1ea] p-3 text-[11px] text-[#718198]">
              No attachments.
            </p>
          ) : (
            <ul className="divide-y divide-[#e2e7ee] rounded-field border border-[#dfe5ec]">
              {attachments.map((attachment) => {
                const isDownloading = downloadingAttachmentId === attachment.id;

                return (
                  <li key={attachment.id}>
                    <button
                      type="button"
                      onClick={() => onDownload(attachment)}
                      disabled={downloadingAttachmentId !== null}
                      aria-busy={isDownloading}
                      className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="min-w-0 truncate text-[11px] font-medium text-[#263b59]">
                        {attachment.fileName}
                      </span>
                      <span className="flex shrink-0 items-center gap-2 text-[10px] text-ink-muted">
                        {formatAttachmentSize(attachment.sizeBytes)}
                        {isDownloading ? (
                          <Spinner
                            className="h-3.5 w-3.5 text-brand"
                            label={`Downloading ${attachment.fileName}`}
                          />
                        ) : (
                          <Download className="h-3.5 w-3.5" />
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
