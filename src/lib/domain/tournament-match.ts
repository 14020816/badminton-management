import type { MatchCategory, MatchStatus, MemberGender, MemberRank, TournamentFormat } from "@prisma/client";
import { z } from "zod";

export const MATCH_CATEGORIES = [
  "MENS_SINGLES",
  "WOMENS_SINGLES",
  "MENS_DOUBLES",
  "WOMENS_DOUBLES",
  "MIXED_DOUBLES",
] as const satisfies readonly MatchCategory[];

export const TOURNAMENT_FORMATS = ["AB_PAIRS", "ROUND_ROBIN"] as const satisfies readonly TournamentFormat[];

export const MATCH_CATEGORY_LABELS: Record<MatchCategory, string> = {
  MENS_SINGLES: "Đơn nam",
  WOMENS_SINGLES: "Đơn nữ",
  MENS_DOUBLES: "Đôi nam",
  WOMENS_DOUBLES: "Đôi nữ",
  MIXED_DOUBLES: "Đôi nam nữ",
};

export const TOURNAMENT_FORMAT_LABELS: Record<TournamentFormat, string> = {
  AB_PAIRS: "Phân bảng A/B",
  ROUND_ROBIN: "Vòng tròn",
};

export const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
  SCHEDULED: "Chưa đấu",
  COMPLETED: "Đã xong",
  WALKOVER: "Bỏ cuộc",
};

export const MEMBER_GENDER_LABELS: Record<MemberGender, string> = {
  MALE: "Nam",
  FEMALE: "Nữ",
};

export const abGroupsSchema = z.object({
  groupA: z.array(z.string()),
  groupB: z.array(z.string()),
});

export const tournamentScheduleConfigSchema = z
  .object({
    categories: z.array(z.enum(MATCH_CATEGORIES)).min(1),
    targetGamesPerMember: z.number().int().min(1).max(20).default(3),
    minGamesPerMember: z.number().int().min(1).max(20).default(1),
    setsPerMatch: z.number().int().min(1).max(5).default(3),
    setsToWin: z.number().int().min(1).max(3).default(2),
    groupCount: z.number().int().min(1).max(8).optional(),
    participantMemberIds: z.array(z.string()).min(2),
    balanceByRank: z.boolean().default(true),
    pointsPerSet: z.number().int().min(1).max(30).optional(),
    abGroups: abGroupsSchema.optional(),
  })
  .refine((c) => c.minGamesPerMember <= c.targetGamesPerMember, {
    message: "Số trận tối thiểu không được lớn hơn mục tiêu",
    path: ["minGamesPerMember"],
  });

export type TournamentScheduleConfig = z.infer<typeof tournamentScheduleConfigSchema>;

export type SchedulerMember = {
  id: string;
  name: string;
  rank: MemberRank | null;
  gender: MemberGender | null;
};

export type GeneratedMatch = {
  order: number;
  round: number | null;
  groupLabel: string | null;
  category: MatchCategory;
  homeMemberId: string | null;
  awayMemberId: string | null;
  homeMember2Id: string | null;
  awayMember2Id: string | null;
};

export type GeneratedBracket = {
  order: number;
  groupAMemberId: string | null;
  groupBMemberId: string | null;
};

export type ScheduleGenerationResult = {
  matches: GeneratedMatch[];
  brackets: GeneratedBracket[];
  warnings: string[];
};

export function parseTournamentScheduleConfig(raw: unknown): TournamentScheduleConfig {
  return tournamentScheduleConfigSchema.parse(raw);
}

export function formatMatchPlayers(
  home: { name: string } | null,
  home2: { name: string } | null,
  away: { name: string } | null,
  away2: { name: string } | null,
): { homeLabel: string; awayLabel: string } {
  const homeLabel = home2 ? `${home?.name ?? "?"} / ${home2.name}` : (home?.name ?? "—");
  const awayLabel = away2 ? `${away?.name ?? "?"} / ${away2.name}` : (away?.name ?? "—");
  return { homeLabel, awayLabel };
}

export function formatMatchScore(
  sets: { setNumber: number; homeScore: number | null; awayScore: number | null }[],
  setsToWin: number,
): string {
  if (sets.length === 0) return "—";
  const completed = sets.filter((s) => s.homeScore != null && s.awayScore != null);
  if (completed.length === 0) return "—";
  let homeWins = 0;
  let awayWins = 0;
  for (const s of completed) {
    if ((s.homeScore ?? 0) > (s.awayScore ?? 0)) homeWins++;
    else if ((s.awayScore ?? 0) > (s.homeScore ?? 0)) awayWins++;
  }
  const setScores = completed.map((s) => `${s.homeScore}-${s.awayScore}`).join(", ");
  if (homeWins >= setsToWin || awayWins >= setsToWin) {
    return `${homeWins}-${awayWins} (${setScores})`;
  }
  return setScores;
}
