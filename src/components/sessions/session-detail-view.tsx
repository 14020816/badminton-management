"use client";

import Link from "next/link";
import { useState } from "react";
import type { CourtType } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { AddressDisplay } from "@/components/form/address-fields";
import {
  SessionEditDialog,
  type EditableSession,
} from "@/components/sessions/session-edit-dialog";
import { SessionDeleteDialog } from "@/components/sessions/session-delete-dialog";
import {
  SessionParticipantsSummary,
  SessionParticipantsTable,
} from "@/components/sessions/session-participants-table";
import { summarizeSessionParticipants } from "@/components/sessions/session-participants-types";
import { formatScheduleTimeRange } from "@/lib/domain/schedule";
import { buildSessionListPath } from "@/lib/sessions-list-filters";
import { formatCourtType, formatSessionDate, formatVND } from "@/lib/format";

type ShuttleTypeOption = {
  id: string;
  name: string;
  pricePerBlock: number;
  shuttlesPerBlock: number;
};

type MemberOption = { id: string; name: string };

export type SessionDetailData = {
  id: string;
  date: Date;
  courtType: CourtType | null;
  courtRental: number;
  water: number;
  parking: number;
  shuttlesUsed: number;
  shuttleTypeId: string | null;
  shuttleType: { id: string; name: string } | null;
  scheduleId: string | null;
  schedule: { id: string; startTime: string; endTime: string } | null;
  address: string | null;
  googleAddressUrl: string | null;
  totalCost: number;
  costPerPerson: number;
  note: string | null;
  shares: {
    memberId: string;
    member: { name: string };
    amount: number;
    water: number;
    parking: number;
    extra: number;
    extraNote: string | null;
    memberPaysForGuests: boolean;
  }[];
  guests: {
    id: string;
    name: string;
    amount: number;
    water: number;
    parking: number;
    extra: number;
    extraNote: string | null;
    hostedByMemberId: string | null;
    hostedBy: { id: string; name: string } | null;
  }[];
};

export function SessionDetailView({
  clubId,
  session,
  members,
  shuttleTypes,
  isAdmin,
  backHref,
}: {
  clubId: string;
  session: SessionDetailData;
  members: MemberOption[];
  shuttleTypes: ShuttleTypeOption[];
  isAdmin: boolean;
  backHref: string;
}) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const participants = {
    date: session.date,
    courtType: session.courtType,
    shuttleTypeName: session.shuttleType?.name,
    shuttlesUsed: session.shuttlesUsed,
    totalCost: session.totalCost,
    shares: session.shares,
    guests: session.guests,
  };

  const { guestCount } = summarizeSessionParticipants(participants);

  const editableSession: EditableSession = {
    id: session.id,
    date: session.date,
    courtType: session.courtType,
    courtRental: session.courtRental,
    shuttlesUsed: session.shuttlesUsed,
    shuttleTypeId: session.shuttleTypeId,
    scheduleId: session.scheduleId,
    address: session.address,
    googleAddressUrl: session.googleAddressUrl,
    note: session.note,
    shares: session.shares.map((share) => ({
      memberId: share.memberId,
      amount: share.amount,
      water: share.water,
      parking: share.parking,
      extra: share.extra,
      extraNote: share.extraNote,
      memberPaysForGuests: share.memberPaysForGuests,
    })),
    guests: session.guests.map((guest) => ({
      id: guest.id,
      name: guest.name,
      amount: guest.amount,
      water: guest.water,
      parking: guest.parking,
      extra: guest.extra,
      extraNote: guest.extraNote,
      hostedByMemberId: guest.hostedByMemberId,
    })),
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          href={backHref}
          className="text-sm text-[var(--color-muted-foreground)] hover:text-[var(--primary)]"
        >
          ← Quay lại danh sách
        </Link>
        <PageHeader
          title={formatSessionDate(session.date)}
          description="Chi tiết buổi đánh"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {session.scheduleId && (
          <Badge variant="outline">Lịch cố định</Badge>
        )}
        {guestCount > 0 && (
          <Badge variant="secondary">{guestCount} khách</Badge>
        )}
        {isAdmin && (
          <>
            <Button type="button" size="sm" onClick={() => setEditing(true)}>
              Sửa
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={() => setDeleting(true)}
            >
              Xóa
            </Button>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-[var(--color-muted-foreground)]">
              Tổng chi phí
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-number text-2xl font-bold">
              {formatVND(session.totalCost)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-[var(--color-muted-foreground)]">
              Mỗi người
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-number text-2xl font-bold">
              {formatVND(session.costPerPerson)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-[var(--color-muted-foreground)]">
              Thuê sân
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-number text-2xl font-bold">
              {formatVND(session.courtRental)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-[var(--color-muted-foreground)]">
              Số cầu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-number text-2xl font-bold">
              {session.shuttlesUsed}
            </p>
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
              {session.shuttleType?.name ?? "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin buổi đánh</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <p>
            <span className="text-[var(--color-muted-foreground)]">
              Loại sân:{" "}
            </span>
            {formatCourtType(session.courtType)}
          </p>
          {session.schedule && (
            <p>
              <span className="text-[var(--color-muted-foreground)]">Giờ: </span>
              {formatScheduleTimeRange(
                session.schedule.startTime,
                session.schedule.endTime,
              )}
            </p>
          )}
          <p>
            <span className="text-[var(--color-muted-foreground)]">Nước: </span>
            {formatVND(session.water)}
          </p>
          <p>
            <span className="text-[var(--color-muted-foreground)]">
              Gửi xe:{" "}
            </span>
            {formatVND(session.parking)}
          </p>
          <AddressDisplay
            address={session.address}
            googleAddressUrl={session.googleAddressUrl}
          />
          {session.note && (
            <p className="sm:col-span-2">
              <span className="text-[var(--color-muted-foreground)]">
                Ghi chú:{" "}
              </span>
              {session.note}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Người tham gia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <SessionParticipantsSummary session={participants} />
          <SessionParticipantsTable session={participants} />
        </CardContent>
      </Card>

      <SessionEditDialog
        clubId={clubId}
        session={editableSession}
        members={members}
        shuttleTypes={shuttleTypes}
        open={editing}
        onOpenChange={setEditing}
      />

      <SessionDeleteDialog
        clubId={clubId}
        session={{ id: session.id, date: session.date }}
        open={deleting}
        onOpenChange={setDeleting}
        redirectTo={buildSessionListPath(clubId, {
          courtType: null,
          memberIds: [],
          date: null,
          note: null,
        })}
      />
    </div>
  );
}
