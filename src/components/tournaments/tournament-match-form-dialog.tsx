"use client";

import { useEffect, useState } from "react";
import type { MatchCategory } from "@prisma/client";
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
import { FormSelect } from "@/components/form/form-select";
import {
  createTournamentMatchAction,
  updateTournamentMatchPlayersAction,
} from "@/actions/tournament-schedule";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  MATCH_CATEGORIES,
  MATCH_CATEGORY_LABELS,
} from "@/lib/domain/tournament-match";
import type { TournamentMatchRow } from "@/components/tournaments/tournament-matches-table";

type MemberOption = { id: string; name: string };

function isDoubles(category: MatchCategory) {
  return (
    category === "MENS_DOUBLES" ||
    category === "WOMENS_DOUBLES" ||
    category === "MIXED_DOUBLES"
  );
}

export function TournamentMatchFormDialog({
  clubId,
  tournamentId,
  members,
  match,
  open,
  onOpenChange,
}: {
  clubId: string;
  tournamentId: string;
  members: MemberOption[];
  match: TournamentMatchRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const isEdit = match != null;
  const [pending, setPending] = useState(false);
  const [category, setCategory] = useState<MatchCategory>("MENS_SINGLES");
  const [homeMemberId, setHomeMemberId] = useState("");
  const [awayMemberId, setAwayMemberId] = useState("");
  const [homeMember2Id, setHomeMember2Id] = useState("");
  const [awayMember2Id, setAwayMember2Id] = useState("");
  const [round, setRound] = useState("");
  const [groupLabel, setGroupLabel] = useState("");

  const memberOptions = members.map((m) => ({ value: m.id, label: m.name }));

  useEffect(() => {
    if (!open) return;
    if (match) {
      setCategory(match.category);
      setHomeMemberId(match.homeMember?.id ?? "");
      setAwayMemberId(match.awayMember?.id ?? "");
      setHomeMember2Id(match.homeMember2?.id ?? "");
      setAwayMember2Id(match.awayMember2?.id ?? "");
      setRound(match.round != null ? String(match.round) : "");
      setGroupLabel(match.groupLabel ?? "");
    } else {
      setCategory("MENS_SINGLES");
      setHomeMemberId("");
      setAwayMemberId("");
      setHomeMember2Id("");
      setAwayMember2Id("");
      setRound("");
      setGroupLabel("");
    }
  }, [match, open]);

  async function handleSubmit() {
    setPending(true);
    try {
      const formData = new FormData();
      if (isEdit && match) formData.set("matchId", match.id);
      else formData.set("tournamentId", tournamentId);
      formData.set("category", category);
      formData.set("homeMemberId", homeMemberId);
      formData.set("awayMemberId", awayMemberId);
      formData.set("homeMember2Id", homeMember2Id);
      formData.set("awayMember2Id", awayMember2Id);
      formData.set("round", round);
      formData.set("groupLabel", groupLabel);

      if (isEdit) {
        await updateTournamentMatchPlayersAction(clubId, formData);
        toast.success("Đã cập nhật trận");
      } else {
        await createTournamentMatchAction(clubId, formData);
        toast.success("Đã thêm trận");
      }
      onOpenChange(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi");
    } finally {
      setPending(false);
    }
  }

  const doubles = isDoubles(category);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Sửa trận đấu" : "Thêm trận đấu"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Hạng mục</Label>
            <FormSelect
              value={category}
              onValueChange={(v) => setCategory(v as MatchCategory)}
              options={MATCH_CATEGORIES.map((c) => ({
                value: c,
                label: MATCH_CATEGORY_LABELS[c],
              }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Đội nhà {doubles ? "1" : ""}</Label>
            <FormSelect
              value={homeMemberId}
              onValueChange={setHomeMemberId}
              placeholder="Chọn thành viên"
              options={memberOptions}
            />
          </div>
          {doubles && (
            <div className="space-y-2">
              <Label>Đội nhà 2</Label>
              <FormSelect
                value={homeMember2Id}
                onValueChange={setHomeMember2Id}
                placeholder="Chọn thành viên"
                options={memberOptions}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label>Đội khách {doubles ? "1" : ""}</Label>
            <FormSelect
              value={awayMemberId}
              onValueChange={setAwayMemberId}
              placeholder="Chọn thành viên"
              options={memberOptions}
            />
          </div>
          {doubles && (
            <div className="space-y-2">
              <Label>Đội khách 2</Label>
              <FormSelect
                value={awayMember2Id}
                onValueChange={setAwayMember2Id}
                placeholder="Chọn thành viên"
                options={memberOptions}
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Vòng</Label>
              <Input
                type="number"
                min={1}
                value={round}
                onChange={(e) => setRound(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Nhãn bảng</Label>
              <Input value={groupLabel} onChange={(e) => setGroupLabel(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button type="button" disabled={pending} onClick={handleSubmit}>
            {pending ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
