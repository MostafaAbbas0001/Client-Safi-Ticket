import { useEffect, useRef, useState } from "react";
import { BadgeCheck, CalendarClock, Check, ContactRound, UserRoundCheck } from "lucide-react";
import { Label } from "@/components/label";
import { MENU_OPTION, MENU_OPTION_ACTIVE, MenuField } from "@/components/menu-field";
import type { DetailItemProps, TicketAssigneeProps, TicketMetadataProps } from "@/models";
import { formatDate } from "../../detailed-ticket-utils";

function DetailItem({ label, value, icon }: DetailItemProps) {
  return (
    <div className="min-w-0 border-l border-[#dfe5ec] pl-3">
      <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[.06em] text-[#718198]">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-2 break-words text-[11px] font-medium leading-4 text-[#102445]">
        {value}
      </div>
    </div>
  );
}

export function TicketMetadata({ ticket, user }: TicketMetadataProps) {
  return (
    <>
      <h2 className="text-[12px] font-semibold text-[#102445]">Ticket details</h2>
      <dl className="mt-4 space-y-4">
        <DetailItem
          label="Requester"
          value={ticket.requester}
          icon={<ContactRound className="h-3.5 w-3.5" />}
        />
        <DetailItem
          label="Created"
          value={formatDate(ticket.createdAt)}
          icon={<CalendarClock className="h-3.5 w-3.5" />}
        />
        <DetailItem
          label="Assignee"
          value={ticket.assignee || (user.role === "officer" ? user.name : "Unassigned")}
          icon={<BadgeCheck className="h-3.5 w-3.5" />}
        />
      </dl>
    </>
  );
}

export function TicketAssignee({
  users,
  draftUserId,
  isAssigning,
  isTerminal,
  onAssign,
}: TicketAssigneeProps) {
  const [open, setOpen] = useState(false);
  const fieldRef = useRef<HTMLDivElement>(null);
  const selectedUser = users.find((staffUser) => String(staffUser.id) === draftUserId);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!fieldRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div>
      <Label
        htmlFor="ticket-page-assignee"
        className="flex items-center gap-2 text-[11px] font-semibold text-[#102445]"
      >
        <UserRoundCheck className="h-4 w-4 text-[#536a85]" />
        Change assignee
      </Label>
      <MenuField
        id="ticket-page-assignee"
        value={selectedUser?.name ?? "Select assignee"}
        open={open}
        onToggle={() => setOpen((current) => !current)}
        fieldRef={fieldRef}
        disabled={isTerminal}
        loading={isAssigning}
        className="mt-2"
      >
        {users.map((staffUser) => {
          const isSelected = String(staffUser.id) === draftUserId;

          return (
            <button
              key={staffUser.id}
              type="button"
              onClick={() => {
                onAssign(String(staffUser.id));
                setOpen(false);
              }}
              className={`${MENU_OPTION} ${isSelected ? MENU_OPTION_ACTIVE : ""}`}
            >
              <span className="truncate">{staffUser.name}</span>
              {isSelected && <Check size={14} className="shrink-0" />}
            </button>
          );
        })}
      </MenuField>
      {isAssigning && (
        <p aria-live="polite" className="mt-1.5 text-[10px] text-ink-muted">
          Assigning...
        </p>
      )}
    </div>
  );
}
