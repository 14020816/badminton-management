import type { MemberGender, MemberRank } from "@prisma/client";

export const MEMBER_RANKS: MemberRank[] = ["S", "A", "B", "C", "D"];
export const MEMBER_GENDERS: MemberGender[] = ["MALE", "FEMALE"];

export function formatMemberRank(rank: MemberRank | null | undefined): string {
  return rank ?? "—";
}

export function parseMemberRank(value: string | null | undefined): MemberRank | null {
  if (!value) return null;
  return MEMBER_RANKS.includes(value as MemberRank) ? (value as MemberRank) : null;
}

export function formatMemberGender(gender: MemberGender | null | undefined): string {
  if (!gender) return "—";
  return gender === "MALE" ? "Nam" : "Nữ";
}

export function parseMemberGender(value: string | null | undefined): MemberGender | null {
  if (!value) return null;
  return MEMBER_GENDERS.includes(value as MemberGender)
    ? (value as MemberGender)
    : null;
}
