"use client";

import Link from "next/link";
import type { CourtType } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MobileDataCard,
  MobileDataField,
  MobileDataFields,
  MobileDataList,
  ResponsiveDataView,
} from "@/components/ui/mobile-data-list";
import { summarizeSessionParticipants } from "@/components/sessions/session-participants-types";
import { buildSessionEditPath } from "@/components/sessions/session-form-types";
import type { SessionParticipantsData } from "@/components/sessions/session-participants-dialog";
import { buildSessionDetailPath } from "@/lib/sessions-list-filters";
import { formatCourtType, formatSessionDate, formatVND } from "@/lib/format";

type SessionRow = {
  id: string;
  date: Date;
  courtType: CourtType | null;
  shuttlesUsed: number;
  shuttleType: { name: string } | null;
  totalCost: number;
  costPerPerson: number;
  note: string | null;
  shares: SessionParticipantsData["shares"];
  guests: SessionParticipantsData["guests"];
  courtRental: number;
  shuttleTypeId: string | null;
  shuttlePricePerBlock: number | null;
  scheduleId: string | null;
  address: string | null;
  googleAddressUrl: string | null;
};

function formatPerPersonAmount(session: SessionRow) {
  const amounts = [
    ...session.shares.filter((share) => share.amount > 0).map((s) => s.amount),
    ...session.guests.filter((guest) => guest.amount > 0).map((g) => g.amount),
  ];
  if (amounts.length === 0) return formatVND(session.costPerPerson);
  const min = Math.min(...amounts);
  const max = Math.max(...amounts);
  return min === max ? formatVND(min) : `${formatVND(min)} – ${formatVND(max)}`;
}

function AdminActions({
  editHref,
  onDelete,
}: {
  editHref: string;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      <Button asChild variant="outline" size="sm">
        <Link href={editHref}>Sửa</Link>
      </Button>
      <Button type="button" variant="destructive" size="sm" onClick={onDelete}>
        Xóa
      </Button>
    </div>
  );
}

function ParticipantsSummary({
  session,
  onViewDetails,
}: {
  session: SessionRow;
  onViewDetails: () => void;
}) {
  const { memberCount, guestCount, total } =
    summarizeSessionParticipants(session);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-sm">{memberCount} thành viên</span>
        {guestCount > 0 && (
          <Badge variant="secondary">{guestCount} khách</Badge>
        )}
      </div>
      <span className="text-xs text-[var(--color-muted-foreground)]">
        {total} người tham gia
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 w-fit px-2 text-xs"
        onClick={onViewDetails}
      >
        Chi tiết
      </Button>
    </div>
  );
}

export function SessionsListData({
  clubId,
  sessions,
  isAdmin,
  onDelete,
  onViewParticipants,
}: {
  clubId: string;
  sessions: SessionRow[];
  isAdmin: boolean;
  onDelete: (session: { id: string; date: Date }) => void;
  onViewParticipants: (data: SessionParticipantsData) => void;
}) {
  const openParticipants = (session: SessionRow) =>
    onViewParticipants({
      date: session.date,
      courtType: session.courtType,
      shuttleTypeName: session.shuttleType?.name,
      shuttlesUsed: session.shuttlesUsed,
      totalCost: session.totalCost,
      shares: session.shares,
      guests: session.guests,
    });

  return (
    <ResponsiveDataView
      mobile={
        <MobileDataList>
          {sessions.map((session) => (
            <MobileDataCard
              key={session.id}
              title={
                <Link
                  href={buildSessionDetailPath(clubId, session.id)}
                  className="text-[var(--primary)] hover:text-[var(--primary-active)] hover:underline"
                >
                  {formatSessionDate(session.date)}
                </Link>
              }
              actions={
                isAdmin ? (
                  <AdminActions
                    editHref={buildSessionEditPath(clubId, session.id)}
                    onDelete={() =>
                      onDelete({ id: session.id, date: session.date })
                    }
                  />
                ) : undefined
              }
            >
              <MobileDataFields>
                <MobileDataField label="Loại sân">
                  {formatCourtType(session.courtType)}
                </MobileDataField>
                <MobileDataField label="Loại cầu">
                  {session.shuttleType?.name ?? "—"}
                  {session.shuttlesUsed > 0 && (
                    <span className="block text-xs text-[var(--color-muted-foreground)]">
                      {session.shuttlesUsed} quả
                    </span>
                  )}
                </MobileDataField>
                <MobileDataField label="Người tham gia" fullWidth>
                  <ParticipantsSummary
                    session={session}
                    onViewDetails={() => openParticipants(session)}
                  />
                </MobileDataField>
                <MobileDataField label="Mỗi người" valueClassName="font-number">
                  {formatPerPersonAmount(session)}
                </MobileDataField>
                <MobileDataField
                  label="Tổng"
                  valueClassName="font-number font-bold text-primary"
                >
                  {formatVND(session.totalCost)}
                </MobileDataField>
                {session.note && (
                  <MobileDataField label="Ghi chú" fullWidth>
                    {session.note}
                  </MobileDataField>
                )}
              </MobileDataFields>
            </MobileDataCard>
          ))}
        </MobileDataList>
      }
      desktop={
        <Table minWidth="40rem">
          <TableHeader>
            <TableRow>
              <TableHead>Ngày</TableHead>
              <TableHead>Loại sân</TableHead>
              <TableHead>Loại cầu</TableHead>
              <TableHead className="min-w-[7rem]">Người tham gia</TableHead>
              <TableHead className="text-right">Mỗi người</TableHead>
              <TableHead className="text-right">Tổng</TableHead>
              <TableHead>Ghi chú</TableHead>
              {isAdmin && (
                <TableHead className="w-[8.5rem]">Thao tác</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session) => (
              <TableRow key={session.id}>
                <TableCell>
                  <Link
                    href={buildSessionDetailPath(clubId, session.id)}
                    className="font-medium text-[var(--primary)] hover:text-[var(--primary-active)] hover:underline"
                  >
                    {formatSessionDate(session.date)}
                  </Link>
                </TableCell>
                <TableCell>{formatCourtType(session.courtType)}</TableCell>
                <TableCell>
                  {session.shuttleType?.name ?? "—"}
                  {session.shuttlesUsed > 0 && (
                    <span className="block text-xs text-[var(--color-muted-foreground)]">
                      {session.shuttlesUsed} quả
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <ParticipantsSummary
                    session={session}
                    onViewDetails={() => openParticipants(session)}
                  />
                </TableCell>
                <TableCell className="font-number text-right">
                  {formatPerPersonAmount(session)}
                </TableCell>
                <TableCell className="font-number text-right">
                  {formatVND(session.totalCost)}
                </TableCell>
                <TableCell>{session.note ?? "—"}</TableCell>
                {isAdmin && (
                  <TableCell>
                    <AdminActions
                      editHref={buildSessionEditPath(clubId, session.id)}
                      onDelete={() =>
                        onDelete({ id: session.id, date: session.date })
                      }
                    />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      }
    />
  );
}
