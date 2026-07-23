"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";
import { updateTournamentBracketsAction } from "@/actions/tournament-schedule";
import { toast } from "sonner";
import {
  TournamentAbGroupsEditor,
  type AbGroupMember,
  type AbGroupsState,
} from "@/components/tournaments/tournament-ab-groups-editor";
import { buildInitialAbGroups } from "@/lib/domain/tournament-scheduler";
import type { TournamentScheduleConfig } from "@/lib/domain/tournament-match";

export function TournamentBracketsEditor({
  clubId,
  tournamentId,
  participants,
  config,
  isAdmin,
}: {
  clubId: string;
  tournamentId: string;
  participants: AbGroupMember[];
  config: TournamentScheduleConfig | null;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const [syncMatches, setSyncMatches] = useState(false);
  const [groups, setGroups] = useState<AbGroupsState>({ groupA: [], groupB: [] });

  const participantIds = useMemo(
    () => new Set(participants.map((p) => p.memberId)),
    [participants],
  );

  useEffect(() => {
    if (config?.abGroups) {
      setGroups({
        groupA: config.abGroups.groupA.filter((id) => participantIds.has(id)),
        groupB: config.abGroups.groupB.filter((id) => participantIds.has(id)),
      });
      return;
    }
    if (participants.length >= 2) {
      const members = participants.map((p) => ({
        id: p.memberId,
        name: p.name,
        rank: p.rank,
        gender: p.gender,
      }));
      setGroups(
        buildInitialAbGroups([...participantIds], true, members),
      );
    }
  }, [config?.abGroups, participantIds, participants]);

  const membersById = useMemo(
    () => new Map(participants.map((p) => [p.memberId, p])),
    [participants],
  );

  async function saveBrackets() {
    setPending(true);
    try {
      await updateTournamentBracketsAction(
        clubId,
        tournamentId,
        JSON.stringify(groups),
        syncMatches,
      );
      toast.success(
        syncMatches ? "Đã lưu bảng và cập nhật trận đấu" : "Đã lưu phân bảng",
      );
      setEditing(false);
      setConfirmSave(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi khi lưu");
    } finally {
      setPending(false);
    }
  }

  if (!isAdmin && groups.groupA.length === 0 && groups.groupB.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold">Phân bảng A / B</h3>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Một lượt thi đấu: đổi cặp trong bảng, đấu chéo với bảng kia (theo số trận tối đa/người).
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            {!editing ? (
              <Button type="button" size="sm" variant="outline" onClick={() => setEditing(true)}>
                Sửa bảng
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditing(false);
                    if (config?.abGroups) {
                      setGroups({
                        groupA: config.abGroups.groupA,
                        groupB: config.abGroups.groupB,
                      });
                    }
                  }}
                >
                  Hủy
                </Button>
                <Button type="button" size="sm" onClick={() => setConfirmSave(true)}>
                  Lưu bảng
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {editing ? (
        <TournamentAbGroupsEditor
          participants={participants}
          selectedIds={participantIds}
          groups={groups}
          onGroupsChange={setGroups}
          onAutoBalance={() => {
            const members = participants.map((p) => ({
              id: p.memberId,
              name: p.name,
              rank: p.rank,
              gender: p.gender,
            }));
            setGroups(
              buildInitialAbGroups([...participantIds], true, members),
            );
          }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-md border border-[var(--color-hairline-on-light)] p-3">
            <p className="mb-2 text-sm font-medium">Bảng A</p>
            <ul className="space-y-1 text-sm">
              {groups.groupA.length === 0 ? (
                <li className="text-[var(--color-muted-foreground)]">Chưa có thành viên</li>
              ) : (
                groups.groupA.map((id) => (
                  <li key={id}>{membersById.get(id)?.name ?? id}</li>
                ))
              )}
            </ul>
          </div>
          <div className="rounded-md border border-[var(--color-hairline-on-light)] p-3">
            <p className="mb-2 text-sm font-medium">Bảng B</p>
            <ul className="space-y-1 text-sm">
              {groups.groupB.length === 0 ? (
                <li className="text-[var(--color-muted-foreground)]">Chưa có thành viên</li>
              ) : (
                groups.groupB.map((id) => (
                  <li key={id}>{membersById.get(id)?.name ?? id}</li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}

      <ConfirmActionDialog
        open={confirmSave}
        onOpenChange={setConfirmSave}
        title="Lưu phân bảng A/B?"
        description={
          <div className="space-y-3">
            <p>
              Thay đổi danh sách bảng A/B sẽ được lưu. Bạn có muốn tạo lại lịch một lượt (đổi cặp
              trong bảng, đấu chéo bảng kia) theo cấu hình giải không?
            </p>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={syncMatches}
                onChange={(e) => setSyncMatches(e.target.checked)}
              />
              Đồng bộ lại các trận đấu
            </label>
          </div>
        }
        confirmLabel="Lưu"
        onConfirm={saveBrackets}
        pending={pending}
      />
    </div>
  );
}
