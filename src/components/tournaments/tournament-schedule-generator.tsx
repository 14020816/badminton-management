"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { TournamentFormat } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FormSelect } from "@/components/form/form-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  generateTournamentScheduleAction,
  previewTournamentScheduleAction,
  clearTournamentScheduleAction,
} from "@/actions/tournament-schedule";
import { toast } from "sonner";
import {
  MATCH_CATEGORIES,
  MATCH_CATEGORY_LABELS,
  TOURNAMENT_FORMAT_LABELS,
  formatMatchPlayers,
  type TournamentScheduleConfig,
} from "@/lib/domain/tournament-match";
import type { ScheduleGenerationResult } from "@/lib/domain/tournament-match";
import { formatMemberGender, formatMemberRank } from "@/lib/domain/member";
import { buildInitialAbGroups } from "@/lib/domain/tournament-scheduler";
import type { MemberGender, MemberRank } from "@prisma/client";
import {
  TournamentAbGroupsEditor,
  type AbGroupsState,
} from "@/components/tournaments/tournament-ab-groups-editor";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";

type Participant = {
  memberId: string;
  name: string;
  rank: MemberRank | null;
  gender: MemberGender | null;
};

const DEFAULT_CONFIG = {
  targetGamesPerMember: 3,
  minGamesPerMember: 1,
  setsPerMatch: 3,
  setsToWin: 2,
  groupCount: 2,
  balanceByRank: true,
  pointsPerSet: 21,
};

export function TournamentScheduleGenerator({
  clubId,
  tournamentId,
  participants,
  hasSchedule,
  format: existingFormat,
  onGenerated,
}: {
  clubId: string;
  tournamentId: string;
  participants: Participant[];
  hasSchedule: boolean;
  format: TournamentFormat | null;
  onGenerated?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [pending, setPending] = useState(false);
  const [format, setFormat] = useState<TournamentFormat>(
    existingFormat ?? "AB_PAIRS",
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(participants.map((p) => p.memberId)),
  );
  const [categories, setCategories] = useState<Set<string>>(
    () => new Set(["MENS_SINGLES"]),
  );
  const [targetGames, setTargetGames] = useState(DEFAULT_CONFIG.targetGamesPerMember);
  const [minGames, setMinGames] = useState(DEFAULT_CONFIG.minGamesPerMember);
  const [setsPerMatch, setSetsPerMatch] = useState(DEFAULT_CONFIG.setsPerMatch);
  const [setsToWin, setSetsToWin] = useState(DEFAULT_CONFIG.setsToWin);
  const [groupCount, setGroupCount] = useState(DEFAULT_CONFIG.groupCount);
  const [balanceByRank, setBalanceByRank] = useState(DEFAULT_CONFIG.balanceByRank);
  const [pointsPerSet, setPointsPerSet] = useState(DEFAULT_CONFIG.pointsPerSet);
  const [abGroups, setAbGroups] = useState<AbGroupsState>({ groupA: [], groupB: [] });
  const [preview, setPreview] = useState<ScheduleGenerationResult | null>(null);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const router = useRouter();

  const memberById = useMemo(
    () => new Map(participants.map((p) => [p.memberId, p])),
    [participants],
  );

  const schedulerMembers = useMemo(
    () =>
      participants.map((p) => ({
        id: p.memberId,
        name: p.name,
        rank: p.rank,
        gender: p.gender,
      })),
    [participants],
  );

  useEffect(() => {
    if (step === 3 && format === "AB_PAIRS" && selectedIds.size >= 2) {
      setAbGroups(
        buildInitialAbGroups([...selectedIds], balanceByRank, schedulerMembers),
      );
    }
  }, [step, format, balanceByRank, selectedIds, schedulerMembers]);

  function buildConfig(): TournamentScheduleConfig {
    return {
      categories: [...categories] as TournamentScheduleConfig["categories"],
      targetGamesPerMember: targetGames,
      minGamesPerMember: Math.min(minGames, targetGames),
      setsPerMatch,
      setsToWin,
      groupCount: format === "ROUND_ROBIN" ? groupCount : undefined,
      participantMemberIds: [...selectedIds],
      balanceByRank,
      pointsPerSet,
      abGroups:
        format === "AB_PAIRS" &&
        (abGroups.groupA.length > 0 || abGroups.groupB.length > 0)
          ? abGroups
          : undefined,
    };
  }

  function toggleParticipant(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleCategory(cat: string) {
    setCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  async function runPreview() {
    if (categories.size === 0) {
      toast.error("Chọn ít nhất một hạng mục");
      return;
    }
    if (selectedIds.size < 2) {
      toast.error("Chọn ít nhất 2 người tham gia");
      return;
    }
    if (minGames > targetGames) {
      toast.error("Số trận tối thiểu không được lớn hơn mục tiêu");
      return;
    }
    setPending(true);
    try {
      const result = await previewTournamentScheduleAction(
        clubId,
        tournamentId,
        format,
        JSON.stringify(buildConfig()),
      );
      setPreview(result);
      setStep(4);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không xem trước được");
    } finally {
      setPending(false);
    }
  }

  async function confirmGenerate() {
    if (!preview || preview.matches.length === 0) {
      toast.error("Không có trận để tạo");
      return;
    }
    setPending(true);
    try {
      const result = await generateTournamentScheduleAction(
        clubId,
        tournamentId,
        format,
        JSON.stringify(buildConfig()),
      );
      toast.success(`Đã tạo ${result.matchCount} trận`);
      if (result.warnings.length > 0) {
        toast.message(result.warnings.join("; "));
      }
      setOpen(false);
      resetWizard();
      router.refresh();
      onGenerated?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi khi tạo lịch");
    } finally {
      setPending(false);
    }
  }

  async function handleClear() {
    setPending(true);
    try {
      await clearTournamentScheduleAction(clubId, tournamentId);
      toast.success("Đã xóa lịch thi đấu");
      setConfirmClear(false);
      router.refresh();
      onGenerated?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi");
    } finally {
      setPending(false);
    }
  }

  function resetWizard() {
    setStep(1);
    setPreview(null);
  }

  function openWizard() {
    if (hasSchedule) {
      setConfirmRegenerate(true);
      return;
    }
    resetWizard();
    setOpen(true);
  }

  const totalSteps = 4;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={openWizard}>
          {hasSchedule ? "Tạo lại lịch" : "Tạo lịch thi đấu"}
        </Button>
        {hasSchedule && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => setConfirmClear(true)}
          >
            Xóa lịch
          </Button>
        )}
      </div>

      <ConfirmActionDialog
        open={confirmRegenerate}
        onOpenChange={setConfirmRegenerate}
        title="Tạo lại lịch thi đấu?"
        description="Lịch và kết quả trận hiện tại sẽ bị xóa khi bạn tạo lịch mới. Tiếp tục?"
        confirmLabel="Tiếp tục"
        variant="destructive"
        onConfirm={() => {
          setConfirmRegenerate(false);
          resetWizard();
          setOpen(true);
        }}
      />

      <ConfirmActionDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title="Xóa toàn bộ lịch?"
        description="Tất cả trận đấu, kết quả và phân bảng A/B sẽ bị xóa. Hành động này không thể hoàn tác."
        confirmLabel="Xóa lịch"
        variant="destructive"
        pending={pending}
        onConfirm={handleClear}
      />

      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) resetWizard();
          setOpen(v);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Tạo lịch thi đấu — Bước {step}/{totalSteps}
            </DialogTitle>
          </DialogHeader>

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Chọn thành viên tham gia (xếp hạng dùng để cân bằng bảng; chưa xếp hạng =
                cùng nhóm).
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setSelectedIds(new Set(participants.map((p) => p.memberId)))
                  }
                >
                  Chọn tất cả
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Bỏ chọn
                </Button>
              </div>
              <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-[var(--color-hairline-on-light)] p-3">
                {participants.map((p) => (
                  <label
                    key={p.memberId}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={selectedIds.has(p.memberId)}
                      onCheckedChange={() => toggleParticipant(p.memberId)}
                    />
                    <span>{p.name}</span>
                    <span className="text-[var(--color-muted-foreground)]">
                      {formatMemberRank(p.rank)} · {formatMemberGender(p.gender)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Thể thức</Label>
                <FormSelect
                  value={format}
                  onValueChange={(v) => setFormat(v as TournamentFormat)}
                  options={[
                    { value: "AB_PAIRS", label: TOURNAMENT_FORMAT_LABELS.AB_PAIRS },
                    {
                      value: "ROUND_ROBIN",
                      label: TOURNAMENT_FORMAT_LABELS.ROUND_ROBIN,
                    },
                  ]}
                />
              </div>
              <div className="space-y-2">
                <Label>Hạng mục trận</Label>
                <div className="flex flex-wrap gap-3">
                  {MATCH_CATEGORIES.map((cat) => (
                    <label key={cat} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={categories.has(cat)}
                        onCheckedChange={() => toggleCategory(cat)}
                      />
                      {MATCH_CATEGORY_LABELS[cat]}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Số trận tối thiểu / người</Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={minGames}
                    onChange={(e) => setMinGames(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Số trận mục tiêu / người</Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={targetGames}
                    onChange={(e) => setTargetGames(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Số set tối đa / trận</Label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={setsPerMatch}
                    onChange={(e) => setSetsPerMatch(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Set cần thắng</Label>
                  <Input
                    type="number"
                    min={1}
                    max={3}
                    value={setsToWin}
                    onChange={(e) => setSetsToWin(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Điểm mỗi set</Label>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={pointsPerSet}
                    onChange={(e) => setPointsPerSet(Number(e.target.value))}
                  />
                </div>
                {format === "ROUND_ROBIN" && (
                  <div className="space-y-2">
                    <Label>Số bảng</Label>
                    <Input
                      type="number"
                      min={1}
                      max={8}
                      value={groupCount}
                      onChange={(e) => setGroupCount(Number(e.target.value))}
                    />
                  </div>
                )}
                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                  <Checkbox
                    checked={balanceByRank}
                    onCheckedChange={(v) => setBalanceByRank(v === true)}
                  />
                  Cân bằng theo hạng (snake draft)
                </label>
              </div>

              {format === "AB_PAIRS" && (
                <TournamentAbGroupsEditor
                  participants={participants.map((p) => ({
                    memberId: p.memberId,
                    name: p.name,
                    rank: p.rank,
                    gender: p.gender,
                  }))}
                  selectedIds={selectedIds}
                  groups={abGroups}
                  onGroupsChange={setAbGroups}
                  onAutoBalance={() =>
                    setAbGroups(
                      buildInitialAbGroups(
                        [...selectedIds],
                        balanceByRank,
                        schedulerMembers,
                      ),
                    )
                  }
                />
              )}
            </div>
          )}

          {step === 4 && preview && (
            <div className="space-y-3">
              {preview.warnings.length > 0 && (
                <ul className="list-inside list-disc text-sm text-amber-600">
                  {preview.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              )}
              <p className="text-sm">
                Sẽ tạo <strong>{preview.matches.length}</strong> trận (một lượt A/B)
              </p>
              <div className="max-h-64 overflow-y-auto rounded-md border border-[var(--color-hairline-on-light)]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Hạng mục</TableHead>
                      <TableHead>Trận</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.matches.slice(0, 50).map((m) => {
                      const home = m.homeMemberId
                        ? memberById.get(m.homeMemberId)
                        : null;
                      const away = m.awayMemberId
                        ? memberById.get(m.awayMemberId)
                        : null;
                      const home2 = m.homeMember2Id
                        ? memberById.get(m.homeMember2Id)
                        : null;
                      const away2 = m.awayMember2Id
                        ? memberById.get(m.awayMember2Id)
                        : null;
                      const { homeLabel, awayLabel } = formatMatchPlayers(
                        home ? { name: home.name } : null,
                        home2 ? { name: home2.name } : null,
                        away ? { name: away.name } : null,
                        away2 ? { name: away2.name } : null,
                      );
                      return (
                        <TableRow key={m.order}>
                          <TableCell>{m.order}</TableCell>
                          <TableCell>{MATCH_CATEGORY_LABELS[m.category]}</TableCell>
                          <TableCell>
                            {homeLabel} vs {awayLabel}
                            {m.groupLabel ? ` (${m.groupLabel})` : ""}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {preview.matches.length > 50 && (
                  <p className="p-2 text-center text-xs text-[var(--color-muted-foreground)]">
                    … và {preview.matches.length - 50} trận khác
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex-wrap gap-2">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((s) => s - 1)}
                disabled={pending}
              >
                Quay lại
              </Button>
            )}
            {step < 3 && (
              <Button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                disabled={step === 1 && selectedIds.size < 2}
              >
                Tiếp
              </Button>
            )}
            {step === 3 && (
              <Button type="button" disabled={pending} onClick={runPreview}>
                {pending ? "Đang tính…" : "Xem trước"}
              </Button>
            )}
            {step === 4 && (
              <Button type="button" disabled={pending} onClick={confirmGenerate}>
                {pending ? "Đang tạo…" : "Tạo lịch"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
