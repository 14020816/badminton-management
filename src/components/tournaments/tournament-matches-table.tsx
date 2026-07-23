"use client";

import { useState } from "react";
import type { MatchCategory, MatchStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
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
import {
  formatMatchPlayers,
  formatMatchScore,
  MATCH_CATEGORY_LABELS,
  MATCH_STATUS_LABELS,
  type TournamentScheduleConfig,
} from "@/lib/domain/tournament-match";
import { TournamentMatchResultDialog } from "@/components/tournaments/tournament-match-result-dialog";
import { TournamentMatchFormDialog } from "@/components/tournaments/tournament-match-form-dialog";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";
import { deleteTournamentMatchAction } from "@/actions/tournament-schedule";
import { toast } from "sonner";

export type TournamentMatchRow = {
  id: string;
  order: number;
  round: number | null;
  groupLabel: string | null;
  category: MatchCategory;
  status: MatchStatus;
  homeMember: { id: string; name: string } | null;
  awayMember: { id: string; name: string } | null;
  homeMember2: { id: string; name: string } | null;
  awayMember2: { id: string; name: string } | null;
  sets: { setNumber: number; homeScore: number | null; awayScore: number | null }[];
};

export function TournamentMatchesTable({
  clubId,
  tournamentId,
  matches,
  members,
  config,
  isAdmin,
}: {
  clubId: string;
  tournamentId: string;
  matches: TournamentMatchRow[];
  members: { id: string; name: string }[];
  config: TournamentScheduleConfig | null;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [resultMatchId, setResultMatchId] = useState<string | null>(null);
  const [editMatch, setEditMatch] = useState<TournamentMatchRow | null | undefined>(
    undefined,
  );
  const [deleteMatchId, setDeleteMatchId] = useState<string | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const setsToWin = config?.setsToWin ?? 2;

  const resultMatch = matches.find((m) => m.id === resultMatchId) ?? null;
  const deleteMatch = matches.find((m) => m.id === deleteMatchId);

  async function confirmDelete() {
    if (!deleteMatchId) return;
    setDeletePending(true);
    try {
      await deleteTournamentMatchAction(clubId, deleteMatchId);
      toast.success("Đã xóa trận");
      setDeleteMatchId(null);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi khi xóa");
    } finally {
      setDeletePending(false);
    }
  }

  function AdminActions({ match }: { match: TournamentMatchRow }) {
    return (
      <div className="flex flex-wrap gap-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setResultMatchId(match.id)}
        >
          KQ
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setEditMatch(match)}
        >
          Sửa
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          onClick={() => setDeleteMatchId(match.id)}
        >
          Xóa
        </Button>
      </div>
    );
  }

  return (
    <>
      {isAdmin && (
        <div className="mb-3">
          <Button type="button" size="sm" onClick={() => setEditMatch(null)}>
            Thêm trận
          </Button>
        </div>
      )}

      {matches.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Chưa có lịch thi đấu. {isAdmin ? "Nhấn «Tạo lịch» để sinh các trận." : ""}
        </p>
      ) : (
        <ResponsiveDataView
          mobile={
            <MobileDataList>
              {matches.map((match) => {
                const { homeLabel, awayLabel } = formatMatchPlayers(
                  match.homeMember,
                  match.homeMember2,
                  match.awayMember,
                  match.awayMember2,
                );
                const roundLabel = [
                  match.groupLabel,
                  match.round != null ? `Vòng ${match.round}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ");

                return (
                  <MobileDataCard
                    key={match.id}
                    title={`#${match.order} ${MATCH_CATEGORY_LABELS[match.category]}`}
                    actions={isAdmin ? <AdminActions match={match} /> : undefined}
                  >
                    <MobileDataFields>
                      {roundLabel && (
                        <MobileDataField label="Vòng/Bảng" fullWidth>
                          {roundLabel}
                        </MobileDataField>
                      )}
                      <MobileDataField label="Đội nhà">{homeLabel}</MobileDataField>
                      <MobileDataField label="Đội khách">{awayLabel}</MobileDataField>
                      <MobileDataField label="Kết quả">
                        {match.status === "WALKOVER"
                          ? "Bỏ cuộc"
                          : formatMatchScore(match.sets, setsToWin)}
                      </MobileDataField>
                      <MobileDataField label="Trạng thái">
                        <Badge
                          variant={
                            match.status === "COMPLETED" ? "default" : "secondary"
                          }
                        >
                          {MATCH_STATUS_LABELS[match.status]}
                        </Badge>
                      </MobileDataField>
                    </MobileDataFields>
                  </MobileDataCard>
                );
              })}
            </MobileDataList>
          }
          desktop={
            <Table minWidth="52rem">
              <TableHeader>
                <TableRow>
                  <TableHead>STT</TableHead>
                  <TableHead>Hạng mục</TableHead>
                  <TableHead>Vòng / Bảng</TableHead>
                  <TableHead>Đội nhà</TableHead>
                  <TableHead>Đội khách</TableHead>
                  <TableHead>Kết quả</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  {isAdmin && <TableHead className="min-w-[10rem]" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.map((match) => {
                  const { homeLabel, awayLabel } = formatMatchPlayers(
                    match.homeMember,
                    match.homeMember2,
                    match.awayMember,
                    match.awayMember2,
                  );
                  const roundLabel = [
                    match.groupLabel,
                    match.round != null ? `Vòng ${match.round}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ");

                  return (
                    <TableRow key={match.id}>
                      <TableCell>{match.order}</TableCell>
                      <TableCell>{MATCH_CATEGORY_LABELS[match.category]}</TableCell>
                      <TableCell>{roundLabel || "—"}</TableCell>
                      <TableCell>{homeLabel}</TableCell>
                      <TableCell>{awayLabel}</TableCell>
                      <TableCell className="font-number">
                        {match.status === "WALKOVER"
                          ? "Bỏ cuộc"
                          : formatMatchScore(match.sets, setsToWin)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            match.status === "COMPLETED" ? "default" : "secondary"
                          }
                        >
                          {MATCH_STATUS_LABELS[match.status]}
                        </Badge>
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <AdminActions match={match} />
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          }
        />
      )}

      <TournamentMatchResultDialog
        clubId={clubId}
        match={resultMatch}
        config={config}
        open={resultMatchId != null}
        onOpenChange={(open) => {
          if (!open) setResultMatchId(null);
        }}
      />

      {editMatch !== undefined && (
        <TournamentMatchFormDialog
          clubId={clubId}
          tournamentId={tournamentId}
          members={members}
          match={editMatch}
          open
          onOpenChange={(open) => {
            if (!open) setEditMatch(undefined);
          }}
        />
      )}

      <ConfirmActionDialog
        open={deleteMatchId != null}
        onOpenChange={(open) => {
          if (!open) setDeleteMatchId(null);
        }}
        title="Xóa trận đấu?"
        description={
          deleteMatch ? (
            <>
              Xóa trận #{deleteMatch.order}? Kết quả đã nhập cũng sẽ bị xóa.
            </>
          ) : (
            "Xóa trận này?"
          )
        }
        confirmLabel="Xóa trận"
        variant="destructive"
        pending={deletePending}
        onConfirm={confirmDelete}
      />
    </>
  );
}
