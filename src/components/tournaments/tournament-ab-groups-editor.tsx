"use client";

import { useMemo } from "react";
import { GripVertical } from "lucide-react";
import { formatMemberRank } from "@/lib/domain/member";
import type { MemberGender, MemberRank } from "@prisma/client";
import { cn } from "@/lib/utils";

export type AbGroupMember = {
  memberId: string;
  name: string;
  rank: MemberRank | null;
  gender: MemberGender | null;
};

export type AbGroupsState = {
  groupA: string[];
  groupB: string[];
};

type DragPayload = { memberId: string; from: "A" | "B" | "pool" };

function GroupColumn({
  title,
  memberIds,
  membersById,
  groupKey,
  onGroupsChange,
  groups,
  selectedIds,
}: {
  title: string;
  memberIds: string[];
  membersById: Map<string, AbGroupMember>;
  groupKey: "A" | "B";
  onGroupsChange: (next: AbGroupsState) => void;
  groups: AbGroupsState;
  selectedIds: Set<string>;
}) {
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const raw = e.dataTransfer.getData("application/json");
    if (!raw) return;
    const { memberId } = JSON.parse(raw) as DragPayload;
    if (!selectedIds.has(memberId)) return;

    const nextA = groups.groupA.filter((id) => id !== memberId);
    const nextB = groups.groupB.filter((id) => id !== memberId);

    if (groupKey === "A") nextA.push(memberId);
    else nextB.push(memberId);

    onGroupsChange({ groupA: nextA, groupB: nextB });
  }

  return (
    <div
      className="flex min-h-[12rem] flex-1 flex-col rounded-lg border border-[var(--color-hairline-on-light)] bg-[var(--surface-soft-light)]"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="border-b border-[var(--color-hairline-on-light)] px-3 py-2 font-semibold text-[var(--ink)]">
        {title}
        <span className="ml-2 text-sm font-normal text-[var(--muted)]">
          ({memberIds.length})
        </span>
      </div>
      <ul className="flex flex-1 flex-col gap-1 p-2">
        {memberIds.length === 0 ? (
          <li className="py-4 text-center text-sm text-[var(--muted)]">
            Kéo thả thành viên vào đây
          </li>
        ) : (
          memberIds.map((id) => {
            const m = membersById.get(id);
            if (!m) return null;
            return (
              <li
                key={id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(
                    "application/json",
                    JSON.stringify({ memberId: id, from: groupKey } satisfies DragPayload),
                  );
                }}
                className={cn(
                  "flex cursor-grab items-center gap-2 rounded-md border border-[var(--color-hairline-on-light)]",
                  "bg-[var(--canvas-light)] px-2 py-1.5 text-sm text-[var(--ink)] active:cursor-grabbing",
                )}
              >
                <GripVertical className="h-4 w-4 shrink-0 text-[var(--muted)]" />
                <span className="min-w-0 flex-1 truncate font-medium">{m.name}</span>
                <span className="shrink-0 text-xs font-semibold text-[var(--muted)]">
                  {formatMemberRank(m.rank)}
                </span>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

export function TournamentAbGroupsEditor({
  participants,
  selectedIds,
  groups,
  onGroupsChange,
  onAutoBalance,
}: {
  participants: AbGroupMember[];
  selectedIds: Set<string>;
  groups: AbGroupsState;
  onGroupsChange: (next: AbGroupsState) => void;
  onAutoBalance?: () => void;
}) {
  const membersById = useMemo(
    () => new Map(participants.map((p) => [p.memberId, p])),
    [participants],
  );

  const inGroups = useMemo(
    () => new Set([...groups.groupA, ...groups.groupB]),
    [groups],
  );

  const poolIds = useMemo(
    () =>
      [...selectedIds].filter((id) => !inGroups.has(id)),
    [selectedIds, inGroups],
  );

  function handlePoolDrop(e: React.DragEvent) {
    e.preventDefault();
    const raw = e.dataTransfer.getData("application/json");
    if (!raw) return;
    const { memberId } = JSON.parse(raw) as DragPayload;
    onGroupsChange({
      groupA: groups.groupA.filter((id) => id !== memberId),
      groupB: groups.groupB.filter((id) => id !== memberId),
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Kéo thả để sắp xếp bảng A và B. Mỗi cặp người chỉ gặp nhau tối đa một trận (đồng đội
          hoặc đối thủ). Thành viên chưa xếp bảng nằm ở danh sách bên dưới.
        </p>
        {onAutoBalance && (
          <button
            type="button"
            className="text-sm font-medium text-[var(--primary)] hover:underline"
            onClick={onAutoBalance}
          >
            Cân bằng tự động
          </button>
        )}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <GroupColumn
          title="Bảng A"
          memberIds={groups.groupA}
          membersById={membersById}
          groupKey="A"
          onGroupsChange={onGroupsChange}
          groups={groups}
          selectedIds={selectedIds}
        />
        <GroupColumn
          title="Bảng B"
          memberIds={groups.groupB}
          membersById={membersById}
          groupKey="B"
          onGroupsChange={onGroupsChange}
          groups={groups}
          selectedIds={selectedIds}
        />
      </div>
      {poolIds.length > 0 && (
        <div
          className="rounded-lg border border-dashed border-[var(--color-hairline-on-light)] p-2"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handlePoolDrop}
        >
          <p className="mb-2 text-xs font-medium text-[var(--color-muted-foreground)]">
            Chưa phân bảng ({poolIds.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {poolIds.map((id) => {
              const m = membersById.get(id);
              if (!m) return null;
              return (
                <div
                  key={id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(
                      "application/json",
                      JSON.stringify({ memberId: id, from: "pool" } satisfies DragPayload),
                    );
                  }}
                  className="flex cursor-grab items-center gap-1 rounded-md border border-[var(--color-hairline-on-light)] bg-[var(--canvas-light)] px-2 py-1 text-sm text-[var(--ink)]"
                >
                  <GripVertical className="h-3 w-3 text-[var(--muted)]" />
                  {m.name}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
