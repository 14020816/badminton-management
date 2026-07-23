"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { MatchStatus } from "@prisma/client";
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
import { updateTournamentMatchResultAction } from "@/actions/tournament-schedule";
import { toast } from "sonner";
import {
  formatMatchPlayers,
  formatMatchScore,
  MATCH_CATEGORY_LABELS,
} from "@/lib/domain/tournament-match";
import type { TournamentScheduleConfig } from "@/lib/domain/tournament-match";

type MatchForResult = {
  id: string;
  category: keyof typeof MATCH_CATEGORY_LABELS;
  status: MatchStatus;
  homeMember: { name: string } | null;
  awayMember: { name: string } | null;
  homeMember2: { name: string } | null;
  awayMember2: { name: string } | null;
  sets: { setNumber: number; homeScore: number | null; awayScore: number | null }[];
};

export function TournamentMatchResultDialog({
  clubId,
  match,
  config,
  open,
  onOpenChange,
  onSaved,
}: {
  clubId: string;
  match: MatchForResult | null;
  config: TournamentScheduleConfig | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}) {
  const setsPerMatch = config?.setsPerMatch ?? 3;
  const setsToWin = config?.setsToWin ?? 2;

  const [sets, setSets] = useState<
    { setNumber: number; homeScore: string; awayScore: string }[]
  >([]);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!match || !open) return;
    const rows = Array.from({ length: setsPerMatch }, (_, i) => {
      const existing = match.sets.find((s) => s.setNumber === i + 1);
      return {
        setNumber: i + 1,
        homeScore: existing?.homeScore?.toString() ?? "",
        awayScore: existing?.awayScore?.toString() ?? "",
      };
    });
    setSets(rows);
  }, [match, open, setsPerMatch]);

  if (!match) return null;

  const { homeLabel, awayLabel } = formatMatchPlayers(
    match.homeMember,
    match.homeMember2,
    match.awayMember,
    match.awayMember2,
  );

  async function save(status: MatchStatus) {
    setPending(true);
    try {
      const formData = new FormData();
      formData.set("matchId", match!.id);
      formData.set("status", status);
      formData.set(
        "sets",
        JSON.stringify(
          sets.map((s) => ({
            setNumber: s.setNumber,
            homeScore: s.homeScore === "" ? null : Number(s.homeScore),
            awayScore: s.awayScore === "" ? null : Number(s.awayScore),
          })),
        ),
      );
      await updateTournamentMatchResultAction(clubId, formData);
      toast.success("Đã lưu kết quả");
      onOpenChange(false);
      setSets([]);
      router.refresh();
      onSaved?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi khi lưu");
    } finally {
      setPending(false);
    }
  }

  const previewSets = sets
    .filter((s) => s.homeScore !== "" && s.awayScore !== "")
    .map((s) => ({
      setNumber: s.setNumber,
      homeScore: Number(s.homeScore),
      awayScore: Number(s.awayScore),
    }));

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setSets([]);
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nhập kết quả</DialogTitle>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {MATCH_CATEGORY_LABELS[match.category]} — {homeLabel} vs {awayLabel}
          </p>
        </DialogHeader>
        <div className="space-y-3">
          {sets.map((set, idx) => (
            <div key={set.setNumber} className="grid grid-cols-[4rem_1fr_1fr] items-center gap-2">
              <Label>Set {set.setNumber}</Label>
              <Input
                type="number"
                min={0}
                max={30}
                placeholder={homeLabel.split(" / ")[0]}
                value={set.homeScore}
                onChange={(e) => {
                  const next = [...sets];
                  next[idx] = { ...next[idx], homeScore: e.target.value };
                  setSets(next);
                }}
              />
              <Input
                type="number"
                min={0}
                max={30}
                placeholder={awayLabel.split(" / ")[0]}
                value={set.awayScore}
                onChange={(e) => {
                  const next = [...sets];
                  next[idx] = { ...next[idx], awayScore: e.target.value };
                  setSets(next);
                }}
              />
            </div>
          ))}
          {previewSets.length > 0 && (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Xem trước: {formatMatchScore(previewSets, setsToWin)}
            </p>
          )}
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => save("WALKOVER")}
          >
            Bỏ cuộc
          </Button>
          <Button type="button" disabled={pending} onClick={() => save("COMPLETED")}>
            {pending ? "Đang lưu..." : "Lưu kết quả"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
