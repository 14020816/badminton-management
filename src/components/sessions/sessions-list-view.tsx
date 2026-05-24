"use client";

import { useState } from "react";
import type { CourtType } from "@prisma/client";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";
import { formatCourtType, formatSessionDate, formatVND } from "@/lib/format";
import {
  buildSessionDetailPath,
  buildSessionListPath,
  hasActiveSessionListFilters,
  type SessionListFilters,
} from "@/lib/sessions-list-filters";
import { SessionsListFilters } from "@/components/sessions/sessions-list-filters";
import {
  SessionEditDialog,
  type EditableSession,
} from "@/components/sessions/session-edit-dialog";
import { SessionDeleteDialog } from "@/components/sessions/session-delete-dialog";
import {
  SessionParticipantsDialog,
  summarizeSessionParticipants,
  type SessionParticipantsData,
} from "@/components/sessions/session-participants-dialog";

type Session = {
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
  address: string | null;
  googleAddressUrl: string | null;
  totalCost: number;
  costPerPerson: number;
  note: string | null;
  shares: {
    memberId: string;
    member: { name: string };
    amount: number;
    water?: number;
    parking?: number;
    extra?: number;
    extraNote?: string | null;
    memberPaysForGuests?: boolean;
  }[];
  guests: {
    id: string;
    name: string;
    amount: number;
    water?: number;
    parking?: number;
    extra?: number;
    extraNote?: string | null;
    hostedByMemberId?: string | null;
    hostedBy?: { id: string; name: string } | null;
  }[];
};

type MemberOption = { id: string; name: string };
type ShuttleTypeOption = {
  id: string;
  name: string;
  pricePerBlock: number;
  shuttlesPerBlock: number;
};

export function SessionsListView({
  clubId,
  sessions,
  filters,
  total,
  totalPages,
  members,
  shuttleTypes,
  isAdmin,
  showMemberFilter,
}: {
  clubId: string;
  sessions: Session[];
  filters: SessionListFilters;
  total: number;
  totalPages: number;
  members: MemberOption[];
  shuttleTypes: ShuttleTypeOption[];
  isAdmin: boolean;
  showMemberFilter: boolean;
}) {
  const [editingSession, setEditingSession] = useState<EditableSession | null>(null);
  const [deletingSession, setDeletingSession] = useState<{
    id: string;
    date: Date;
  } | null>(null);
  const [viewingParticipants, setViewingParticipants] =
    useState<SessionParticipantsData | null>(null);

  const filterValues = {
    courtType: filters.courtType,
    memberIds: filters.memberIds,
    date: filters.date,
    note: filters.note,
  };
  const hasFilters = hasActiveSessionListFilters(filterValues);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Danh sách buổi đánh"
        description={
          hasFilters
            ? `${total} kết quả phù hợp`
            : `${total} buổi đã ghi nhận`
        }
      />

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Lịch sử</CardTitle>
          {isAdmin && (
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href={`/g/${clubId}/sessions/schedule`}>Thêm cố định</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={`/g/${clubId}/sessions/new`}>Thêm thủ công</Link>
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <SessionsListFilters
            clubId={clubId}
            filters={filters}
            members={members}
            showMemberFilter={showMemberFilter}
          />

          <Table minWidth="40rem">
            <TableHeader>
              <TableRow>
                <TableHead>Ngày</TableHead>
                <TableHead>Loại sân</TableHead>
                <TableHead className="hidden md:table-cell">Loại cầu</TableHead>
                <TableHead className="min-w-[7rem]">Người tham gia</TableHead>
                <TableHead className="text-right">Mỗi người</TableHead>
                <TableHead className="text-right">Tổng</TableHead>
                <TableHead className="hidden sm:table-cell">Ghi chú</TableHead>
                {isAdmin && <TableHead className="w-[8.5rem]">Thao tác</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isAdmin ? 8 : 7}
                    className="py-8 text-center text-[var(--color-muted-foreground)]"
                  >
                    {hasFilters ? "Không có kết quả phù hợp" : "Chưa có buổi đánh nào"}
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((session) => (
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
                    <TableCell className="hidden md:table-cell">
                      {session.shuttleType?.name ?? "—"}
                      {session.shuttlesUsed > 0 && (
                        <span className="block text-xs text-[var(--color-muted-foreground)]">
                          {session.shuttlesUsed} quả
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const { memberCount, guestCount, total } =
                          summarizeSessionParticipants(session);
                        return (
                          <div className="flex flex-col gap-1.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-sm">
                                {memberCount} thành viên
                              </span>
                              {guestCount > 0 && (
                                <Badge variant="secondary">
                                  {guestCount} khách
                                </Badge>
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
                              onClick={() =>
                                setViewingParticipants({
                                  date: session.date,
                                  courtType: session.courtType,
                                  shuttleTypeName: session.shuttleType?.name,
                                  shuttlesUsed: session.shuttlesUsed,
                                  totalCost: session.totalCost,
                                  shares: session.shares,
                                  guests: session.guests,
                                })
                              }
                            >
                              Chi tiết
                            </Button>
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="font-number text-right">
                      {(() => {
                        const amounts = [
                          ...session.shares
                            .filter((share) => share.amount > 0)
                            .map((share) => share.amount),
                          ...session.guests
                            .filter((guest) => guest.amount > 0)
                            .map((guest) => guest.amount),
                        ];
                        if (amounts.length === 0) {
                          return formatVND(session.costPerPerson);
                        }
                        const min = Math.min(...amounts);
                        const max = Math.max(...amounts);
                        return min === max
                          ? formatVND(min)
                          : `${formatVND(min)} – ${formatVND(max)}`;
                      })()}
                    </TableCell>
                    <TableCell className="font-number text-right">
                      {formatVND(session.totalCost)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {session.note ?? "—"}
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setEditingSession({
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
                              })
                            }
                          >
                            Sửa
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              setDeletingSession({
                                id: session.id,
                                date: session.date,
                              })
                            }
                          >
                            Xóa
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {total > 0 && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[var(--color-muted-foreground)]">
                {total} kết quả · trang {filters.page}/{totalPages}
              </p>
              <div className="flex gap-2">
                {filters.page > 1 ? (
                  <Button asChild variant="outline" size="sm">
                    <Link
                      href={buildSessionListPath(clubId, {
                        ...filterValues,
                        page: filters.page - 1,
                      })}
                    >
                      Trước
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    Trước
                  </Button>
                )}
                {filters.page < totalPages ? (
                  <Button asChild variant="outline" size="sm">
                    <Link
                      href={buildSessionListPath(clubId, {
                        ...filterValues,
                        page: filters.page + 1,
                      })}
                    >
                      Sau
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    Sau
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <SessionEditDialog
        clubId={clubId}
        session={editingSession}
        members={members}
        shuttleTypes={shuttleTypes}
        open={editingSession !== null}
        onOpenChange={(open) => {
          if (!open) setEditingSession(null);
        }}
      />

      <SessionParticipantsDialog
        session={viewingParticipants}
        open={viewingParticipants !== null}
        onOpenChange={(open) => {
          if (!open) setViewingParticipants(null);
        }}
      />

      <SessionDeleteDialog
        clubId={clubId}
        session={deletingSession}
        open={deletingSession !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingSession(null);
        }}
      />
    </div>
  );
}
