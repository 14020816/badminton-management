"use server";

import { Prisma, type MatchStatus, type TournamentFormat } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireClubAdmin, requireClubViewAccess } from "@/lib/club-context";
import {
  generateTournamentSchedule,
  matchesFromAbGroups,
} from "@/lib/domain/tournament-scheduler";
import type { MatchCategory } from "@prisma/client";
import {
  parseTournamentScheduleConfig,
  type TournamentScheduleConfig,
} from "@/lib/domain/tournament-match";

function tournamentPaths(clubId: string) {
  return [`/g/${clubId}/tournaments`, `/g/${clubId}`];
}

export async function previewTournamentScheduleAction(
  clubId: string,
  tournamentId: string,
  format: TournamentFormat,
  configJson: string,
) {
  await requireClubViewAccess(clubId);

  const tournament = await db.tournament.findFirst({
    where: { id: tournamentId, clubId },
    include: {
      members: {
        include: {
          member: { select: { id: true, name: true, rank: true, gender: true } },
        },
      },
    },
  });
  if (!tournament) throw new Error("Không tìm thấy giải đấu");

  const config = parseTournamentScheduleConfig(JSON.parse(configJson));
  const members = tournament.members.map((tm) => tm.member);

  return generateTournamentSchedule(members, format, config);
}

export async function generateTournamentScheduleAction(
  clubId: string,
  tournamentId: string,
  format: TournamentFormat,
  configJson: string,
) {
  await requireClubAdmin(clubId);

  const tournament = await db.tournament.findFirst({
    where: { id: tournamentId, clubId },
    include: {
      members: {
        include: {
          member: { select: { id: true, name: true, rank: true, gender: true } },
        },
      },
    },
  });
  if (!tournament) throw new Error("Không tìm thấy giải đấu");

  const config = parseTournamentScheduleConfig(JSON.parse(configJson));
  const members = tournament.members.map((tm) => tm.member);
  const { matches, brackets, warnings } = generateTournamentSchedule(
    members,
    format,
    config,
  );

  if (matches.length === 0) {
    throw new Error(
      warnings.length > 0 ? warnings.join("; ") : "Không tạo được trận đấu nào",
    );
  }

  await db.$transaction(async (tx) => {
    await tx.tournamentMatchSet.deleteMany({
      where: { match: { tournamentId } },
    });
    await tx.tournamentMatch.deleteMany({ where: { tournamentId } });
    await tx.tournamentBracket.deleteMany({ where: { tournamentId } });

    if (format === "AB_PAIRS" && brackets.length > 0) {
      await tx.tournamentBracket.createMany({
        data: brackets.map((b) => ({
          tournamentId,
          order: b.order,
          groupAMemberId: b.groupAMemberId,
          groupBMemberId: b.groupBMemberId,
        })),
      });
    }

    for (const match of matches) {
      await tx.tournamentMatch.create({
        data: {
          tournamentId,
          order: match.order,
          round: match.round,
          groupLabel: match.groupLabel,
          category: match.category,
          homeMemberId: match.homeMemberId,
          awayMemberId: match.awayMemberId,
          homeMember2Id: match.homeMember2Id,
          awayMember2Id: match.awayMember2Id,
        },
      });
    }

    await tx.tournament.update({
      where: { id: tournamentId },
      data: {
        format,
        config: config as object,
        scheduleGeneratedAt: new Date(),
      },
    });
  });

  tournamentPaths(clubId).forEach((path) => revalidatePath(path));
  return { matchCount: matches.length, warnings };
}

export async function clearTournamentScheduleAction(
  clubId: string,
  tournamentId: string,
) {
  await requireClubAdmin(clubId);

  const tournament = await db.tournament.findFirst({
    where: { id: tournamentId, clubId },
    select: { id: true },
  });
  if (!tournament) throw new Error("Không tìm thấy giải đấu");

  await db.$transaction(async (tx) => {
    await tx.tournamentMatchSet.deleteMany({
      where: { match: { tournamentId } },
    });
    await tx.tournamentMatch.deleteMany({ where: { tournamentId } });
    await tx.tournamentBracket.deleteMany({ where: { tournamentId } });
    await tx.tournament.update({
      where: { id: tournamentId },
      data: {
        format: null,
        config: Prisma.DbNull,
        scheduleGeneratedAt: null,
      },
    });
  });

  tournamentPaths(clubId).forEach((path) => revalidatePath(path));
}

export async function updateTournamentMatchResultAction(
  clubId: string,
  formData: FormData,
) {
  await requireClubAdmin(clubId);

  const matchId = String(formData.get("matchId") ?? "");
  const status = String(formData.get("status") ?? "COMPLETED") as MatchStatus;
  const setsJson = String(formData.get("sets") ?? "[]");

  const match = await db.tournamentMatch.findFirst({
    where: { id: matchId, tournament: { clubId } },
    include: { tournament: { select: { config: true } } },
  });
  if (!match) throw new Error("Không tìm thấy trận đấu");

  const sets = JSON.parse(setsJson) as {
    setNumber: number;
    homeScore: number | null;
    awayScore: number | null;
  }[];

  if (status === "WALKOVER") {
    await db.$transaction(async (tx) => {
      await tx.tournamentMatchSet.deleteMany({ where: { matchId } });
      await tx.tournamentMatch.update({
        where: { id: matchId },
        data: { status: "WALKOVER" },
      });
    });
  } else {
    for (const s of sets) {
      if (s.homeScore != null && s.homeScore < 0) {
        throw new Error("Điểm không hợp lệ");
      }
      if (s.awayScore != null && s.awayScore < 0) {
        throw new Error("Điểm không hợp lệ");
      }
      if (s.homeScore != null && s.homeScore > 30) {
        throw new Error("Điểm vượt giới hạn");
      }
      if (s.awayScore != null && s.awayScore > 30) {
        throw new Error("Điểm vượt giới hạn");
      }
    }

    const config = match.tournament.config as TournamentScheduleConfig | null;
    const setsToWin = config?.setsToWin ?? 2;

    let homeWins = 0;
    let awayWins = 0;
    for (const s of sets) {
      if (s.homeScore == null || s.awayScore == null) continue;
      if (s.homeScore > s.awayScore) homeWins++;
      else if (s.awayScore > s.homeScore) awayWins++;
    }

    const completed =
      homeWins >= setsToWin || awayWins >= setsToWin || status === "COMPLETED";

    await db.$transaction(async (tx) => {
      await tx.tournamentMatchSet.deleteMany({ where: { matchId } });
      for (const s of sets) {
        if (s.homeScore == null && s.awayScore == null) continue;
        await tx.tournamentMatchSet.create({
          data: {
            matchId,
            setNumber: s.setNumber,
            homeScore: s.homeScore,
            awayScore: s.awayScore,
          },
        });
      }
      await tx.tournamentMatch.update({
        where: { id: matchId },
        data: { status: completed ? "COMPLETED" : "SCHEDULED" },
      });
    });
  }

  tournamentPaths(clubId).forEach((path) => revalidatePath(path));
}

export async function updateTournamentBracketsAction(
  clubId: string,
  tournamentId: string,
  bracketsJson: string,
  syncAbMatches: boolean,
) {
  await requireClubAdmin(clubId);

  const tournament = await db.tournament.findFirst({
    where: { id: tournamentId, clubId },
    select: { id: true, format: true, config: true },
  });
  if (!tournament) throw new Error("Không tìm thấy giải đấu");
  if (tournament.format !== "AB_PAIRS") {
    throw new Error("Chỉ áp dụng cho thể thức phân bảng A/B");
  }

  const payload = JSON.parse(bracketsJson) as
    | { groupA: string[]; groupB: string[] }
    | Array<{
        order: number;
        groupAMemberId: string | null;
        groupBMemberId: string | null;
      }>;

  let groupA: string[];
  let groupB: string[];
  if (Array.isArray(payload)) {
    groupA = [
      ...new Set(
        payload.map((r) => r.groupAMemberId).filter((id): id is string => !!id),
      ),
    ];
    groupB = [
      ...new Set(
        payload.map((r) => r.groupBMemberId).filter((id): id is string => !!id),
      ),
    ];
  } else {
    groupA = payload.groupA;
    groupB = payload.groupB;
  }

  const parsedConfig = tournament.config
    ? parseTournamentScheduleConfig(tournament.config)
    : null;
  const primaryCategory = parsedConfig?.categories[0] ?? "MENS_SINGLES";
  const nextConfig: TournamentScheduleConfig | null = parsedConfig
    ? { ...parsedConfig, abGroups: { groupA, groupB } }
    : null;

  await db.$transaction(async (tx) => {
    if (nextConfig) {
      await tx.tournament.update({
        where: { id: tournamentId },
        data: { config: nextConfig as object },
      });
    }

    if (syncAbMatches) {
      const members = await tx.member.findMany({
        where: { id: { in: [...new Set([...groupA, ...groupB])] } },
        select: { id: true, name: true, rank: true, gender: true },
      });

      const { matches, brackets } = matchesFromAbGroups(
        groupA,
        groupB,
        primaryCategory as MatchCategory,
        1,
        parsedConfig
          ? {
              minGamesPerMember: parsedConfig.minGamesPerMember,
              targetGamesPerMember: parsedConfig.targetGamesPerMember,
            }
          : undefined,
        members,
      );

      await tx.tournamentMatchSet.deleteMany({
        where: { match: { tournamentId } },
      });
      await tx.tournamentMatch.deleteMany({ where: { tournamentId } });

      for (const match of matches) {
        await tx.tournamentMatch.create({
          data: {
            tournamentId,
            order: match.order,
            round: match.round,
            groupLabel: match.groupLabel,
            category: match.category,
            homeMemberId: match.homeMemberId,
            awayMemberId: match.awayMemberId,
            homeMember2Id: match.homeMember2Id,
            awayMember2Id: match.awayMember2Id,
          },
        });
      }

      await tx.tournamentBracket.deleteMany({ where: { tournamentId } });
      if (brackets.length > 0) {
        await tx.tournamentBracket.createMany({
          data: brackets.map((b) => ({
            tournamentId,
            order: b.order,
            groupAMemberId: b.groupAMemberId,
            groupBMemberId: b.groupBMemberId,
          })),
        });
      }
    }
  });

  tournamentPaths(clubId).forEach((path) => revalidatePath(path));
}

export async function createTournamentMatchAction(
  clubId: string,
  formData: FormData,
) {
  await requireClubAdmin(clubId);

  const tournamentId = String(formData.get("tournamentId") ?? "");
  const category = String(formData.get("category") ?? "") as MatchCategory;
  const homeMemberId = String(formData.get("homeMemberId") ?? "") || null;
  const awayMemberId = String(formData.get("awayMemberId") ?? "") || null;
  const homeMember2Id = String(formData.get("homeMember2Id") ?? "") || null;
  const awayMember2Id = String(formData.get("awayMember2Id") ?? "") || null;
  const roundRaw = String(formData.get("round") ?? "");
  const groupLabel = String(formData.get("groupLabel") ?? "").trim() || null;

  const tournament = await db.tournament.findFirst({
    where: { id: tournamentId, clubId },
    select: { id: true },
  });
  if (!tournament) throw new Error("Không tìm thấy giải đấu");

  const maxOrder = await db.tournamentMatch.aggregate({
    where: { tournamentId },
    _max: { order: true },
  });

  await db.tournamentMatch.create({
    data: {
      tournamentId,
      order: (maxOrder._max.order ?? 0) + 1,
      round: roundRaw ? Number(roundRaw) : null,
      groupLabel,
      category,
      homeMemberId,
      awayMemberId,
      homeMember2Id,
      awayMember2Id,
    },
  });

  tournamentPaths(clubId).forEach((path) => revalidatePath(path));
}

export async function updateTournamentMatchPlayersAction(
  clubId: string,
  formData: FormData,
) {
  await requireClubAdmin(clubId);

  const matchId = String(formData.get("matchId") ?? "");
  const category = String(formData.get("category") ?? "") as MatchCategory;
  const homeMemberId = String(formData.get("homeMemberId") ?? "") || null;
  const awayMemberId = String(formData.get("awayMemberId") ?? "") || null;
  const homeMember2Id = String(formData.get("homeMember2Id") ?? "") || null;
  const awayMember2Id = String(formData.get("awayMember2Id") ?? "") || null;
  const roundRaw = String(formData.get("round") ?? "");
  const groupLabel = String(formData.get("groupLabel") ?? "").trim() || null;

  const match = await db.tournamentMatch.findFirst({
    where: { id: matchId, tournament: { clubId } },
  });
  if (!match) throw new Error("Không tìm thấy trận đấu");

  await db.tournamentMatch.update({
    where: { id: matchId },
    data: {
      category,
      homeMemberId,
      awayMemberId,
      homeMember2Id,
      awayMember2Id,
      round: roundRaw ? Number(roundRaw) : null,
      groupLabel,
      status: "SCHEDULED",
    },
  });

  await db.tournamentMatchSet.deleteMany({ where: { matchId } });

  tournamentPaths(clubId).forEach((path) => revalidatePath(path));
}

export async function deleteTournamentMatchAction(
  clubId: string,
  matchId: string,
) {
  await requireClubAdmin(clubId);

  const match = await db.tournamentMatch.findFirst({
    where: { id: matchId, tournament: { clubId } },
    select: { id: true, tournamentId: true },
  });
  if (!match) throw new Error("Không tìm thấy trận đấu");

  await db.$transaction(async (tx) => {
    await tx.tournamentMatchSet.deleteMany({ where: { matchId } });
    await tx.tournamentMatch.delete({ where: { id: matchId } });
    const remaining = await tx.tournamentMatch.findMany({
      where: { tournamentId: match.tournamentId },
      orderBy: { order: "asc" },
      select: { id: true },
    });
    for (let i = 0; i < remaining.length; i++) {
      await tx.tournamentMatch.update({
        where: { id: remaining[i].id },
        data: { order: i + 1 },
      });
    }
  });

  tournamentPaths(clubId).forEach((path) => revalidatePath(path));
}
