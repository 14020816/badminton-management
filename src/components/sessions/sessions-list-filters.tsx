"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CourtType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import { COURT_TYPE_LABELS, COURT_TYPES } from "@/lib/format";
import {
  buildSessionListPath,
  type SessionListFilters,
} from "@/lib/sessions-list-filters";

const selectClassName =
  "flex h-10 w-full rounded-md border border-[var(--color-input)] bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]";

type MemberOption = { id: string; name: string };

export function SessionsListFilters({
  clubId,
  filters,
  members,
  showMemberFilter,
}: {
  clubId: string;
  filters: SessionListFilters;
  members: MemberOption[];
  showMemberFilter: boolean;
}) {
  const router = useRouter();
  const [courtType, setCourtType] = useState(filters.courtType ?? "");
  const [memberIds, setMemberIds] = useState<string[]>(filters.memberIds);
  const [date, setDate] = useState(filters.date ?? "");
  const [note, setNote] = useState(filters.note ?? "");

  function applyFilters() {
    router.push(
      buildSessionListPath(clubId, {
        courtType: courtType ? (courtType as CourtType) : null,
        memberIds,
        date: date || null,
        note: note.trim() || null,
      }),
    );
  }

  function resetFilters() {
    setCourtType("");
    setMemberIds([]);
    setDate("");
    setNote("");
    router.push(
      buildSessionListPath(clubId, {
        courtType: null,
        memberIds: [],
        date: null,
        note: null,
      }),
    );
  }

  return (
    <form
      className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4"
      onSubmit={(event) => {
        event.preventDefault();
        applyFilters();
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="courtType">Loại sân</Label>
        <select
          id="courtType"
          value={courtType}
          onChange={(event) => setCourtType(event.target.value)}
          className={selectClassName}
        >
          <option value="">Tất cả loại sân</option>
          {COURT_TYPES.map((type) => (
            <option key={type} value={type}>
              {COURT_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </div>

      {showMemberFilter && (
        <div className="space-y-2">
          <Label htmlFor="members">Thành viên</Label>
          <MultiSelect
            id="members"
            options={members.map((member) => ({
              value: member.id,
              label: member.name,
            }))}
            value={memberIds}
            onChange={setMemberIds}
            placeholder="Tất cả thành viên"
            emptyMessage="Chưa có thành viên"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="date">Ngày</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Ghi chú</Label>
        <Input
          id="note"
          type="search"
          placeholder="Tìm trong ghi chú..."
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2 lg:col-span-2 xl:col-span-4">
        <Button type="submit" size="sm">
          Lọc
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={resetFilters}
        >
          Xóa bộ lọc
        </Button>
      </div>
    </form>
  );
}
