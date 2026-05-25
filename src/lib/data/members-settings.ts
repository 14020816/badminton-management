import { db } from "@/lib/db";
import {
  activeSessionShareWhere,
  loadClubMemberLedger,
} from "@/lib/data/member-ledger";

export async function loadMembersSettingsData(clubId: string) {
  const [members, ledger, sessionCounts, totalSessionCount] = await Promise.all([
    db.member.findMany({
      where: { clubId },
      include: {
        membership: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: [{ rank: { sort: "asc", nulls: "last" } }, { name: "asc" }],
    }),
    loadClubMemberLedger(clubId),
    db.sessionShare.groupBy({
      by: ["memberId"],
      where: activeSessionShareWhere(clubId),
      _count: true,
    }),
    db.playSession.count({ where: { clubId, deletedAt: null } }),
  ]);

  const ledgerByMember = new Map(ledger.map((row) => [row.memberId, row]));
  const sessionCountByMember = new Map(
    sessionCounts.map((row) => [row.memberId, row._count]),
  );

  return {
    members: members.map((member) => {
      const ledgerRow = ledgerByMember.get(member.id);
      return {
        ...member,
        totalPaid: ledgerRow?.totalPaid ?? 0,
        totalPlayCost: ledgerRow?.totalPlayCost ?? 0,
        remainingBalance: ledgerRow?.remainingBalance ?? 0,
        sessionCount: sessionCountByMember.get(member.id) ?? 0,
      };
    }),
    totalSessionCount,
  };
}
