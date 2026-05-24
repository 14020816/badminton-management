import { db } from "@/lib/db";
import { calcMemberLedger, type MemberLedgerRow } from "@/lib/domain/ledger";

export function activeSessionShareWhere(clubId: string) {
  return {
    amount: { gt: 0 },
    session: { clubId, deletedAt: null },
  } as const;
}

export async function loadClubMemberLedger(
  clubId: string,
): Promise<MemberLedgerRow[]> {
  const [members, transactions, sessionShares, tournamentMembers, partyMembers] =
    await Promise.all([
      db.member.findMany({ where: { clubId }, orderBy: { name: "asc" } }),
      db.transaction.findMany({
        where: { clubId, deletedAt: null },
        select: { type: true, amount: true, category: true, memberId: true },
      }),
      db.sessionShare.findMany({
        where: activeSessionShareWhere(clubId),
        select: { memberId: true, amount: true },
      }),
      db.tournamentMember.findMany({
        where: {
          tournament: { clubId },
          countsToBudget: true,
          amount: { gt: 0 },
        },
        select: { memberId: true, amount: true },
      }),
      db.partyMember.findMany({
        where: { party: { clubId }, countsToBudget: true },
        select: { memberId: true, amount: true },
      }),
    ]);

  return calcMemberLedger(
    members,
    transactions,
    sessionShares,
    tournamentMembers.map((item) => ({
      memberId: item.memberId,
      amount: item.amount,
    })),
    partyMembers.map((item) => ({
      memberId: item.memberId,
      amount: item.amount,
    })),
  );
}

export async function loadMemberLedgerRow(
  clubId: string,
  memberId: string,
): Promise<MemberLedgerRow | null> {
  const memberLedger = await loadClubMemberLedger(clubId);
  return memberLedger.find((row) => row.memberId === memberId) ?? null;
}
