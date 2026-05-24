import type { MemberRank } from "@prisma/client";

export const MEMBER_RANKS: MemberRank[] = ["S", "A", "B", "C", "D"];

export function formatMemberRank(rank: MemberRank | null | undefined): string {
  return rank ?? "—";
}

export function parseMemberRank(value: string | null | undefined): MemberRank | null {
  if (!value) return null;
  return MEMBER_RANKS.includes(value as MemberRank) ? (value as MemberRank) : null;
}
