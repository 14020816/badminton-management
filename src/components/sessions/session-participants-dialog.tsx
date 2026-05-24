"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCourtType, formatSessionDate, formatVND } from "@/lib/format";
import { SessionParticipantsTable } from "@/components/sessions/session-participants-table";
import {
  summarizeSessionParticipants,
  type SessionParticipantsData,
} from "@/components/sessions/session-participants-types";

export type { SessionParticipantsData } from "@/components/sessions/session-participants-types";
export { summarizeSessionParticipants } from "@/components/sessions/session-participants-types";

export function SessionParticipantsDialog({
  session,
  open,
  onOpenChange,
}: {
  session: SessionParticipantsData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!session) return null;

  const { memberCount, guestCount, total } =
    summarizeSessionParticipants(session);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Người tham gia</DialogTitle>
          <DialogDescription>
            Buổi đánh ngày {formatSessionDate(session.date)}
            {session.courtType
              ? ` · ${formatCourtType(session.courtType)}`
              : ""}
            {session.shuttleTypeName ? ` · ${session.shuttleTypeName}` : ""}
            {session.shuttlesUsed && session.shuttlesUsed > 0
              ? ` · ${session.shuttlesUsed} quả`
              : ""}
            {" · "}
            {total} người ({memberCount} thành viên
            {guestCount > 0 ? `, ${guestCount} khách` : ""}) · Tổng{" "}
            {formatVND(session.totalCost)}
          </DialogDescription>
        </DialogHeader>

        <SessionParticipantsTable session={session} />
      </DialogContent>
    </Dialog>
  );
}
