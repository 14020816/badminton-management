"use client";

import { useState } from "react";
import type { CourtType } from "@prisma/client";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SessionsListData } from "@/components/sessions/sessions-list-data";
import { PageHeader } from "@/components/layout/page-header";
import {
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
  shuttlePricePerBlock: number | null;
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
    paysShuttleCost?: boolean;
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

          {sessions.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--color-muted-foreground)]">
              {hasFilters ? "Không có kết quả phù hợp" : "Chưa có buổi đánh nào"}
            </p>
          ) : (
            <SessionsListData
              clubId={clubId}
              sessions={sessions}
              isAdmin={isAdmin}
              onEdit={setEditingSession}
              onDelete={setDeletingSession}
              onViewParticipants={setViewingParticipants}
            />
          )}

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
