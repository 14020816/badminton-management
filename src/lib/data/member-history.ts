import { db } from "@/lib/db";
import {
  activeSessionShareWhere,
  loadMemberLedgerRow,
} from "@/lib/data/member-ledger";

export const MEMBER_HISTORY_SESSION_PAGE_SIZE = 15;

const sessionShareInclude = {
  session: {
    include: {
      shuttleType: { select: { name: true } },
    },
  },
} as const;

function memberSessionShareWhere(clubId: string, memberId: string) {
  return {
    ...activeSessionShareWhere(clubId),
    memberId,
  } as const;
}

export function parseMemberHistorySearchParams(
  searchParams: Record<string, string | string[] | undefined>,
) {
  const pageRaw =
    typeof searchParams.sessionPage === "string"
      ? Number.parseInt(searchParams.sessionPage, 10)
      : 1;
  const sessionPage = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;

  return { sessionPage };
}

export function buildMemberHistoryPath(
  clubId: string,
  memberId: string,
  options?: { sessionPage?: number },
) {
  const params = new URLSearchParams();
  if (options?.sessionPage && options.sessionPage > 1) {
    params.set("sessionPage", String(options.sessionPage));
  }
  const query = params.toString();
  return `/g/${clubId}/members/${memberId}${query ? `?${query}` : ""}`;
}

export async function getMemberHistory(
  clubId: string,
  memberId: string,
  options?: { sessionPage?: number },
) {
  const member = await db.member.findFirst({
    where: { id: memberId, clubId },
  });
  if (!member) return null;

  const sessionPage = options?.sessionPage ?? 1;
  const sessionWhere = memberSessionShareWhere(clubId, memberId);

  const [transactions, sessionCount, sessionCostAgg, tournamentMembers, partyMembers, ledger] =
    await Promise.all([
      db.transaction.findMany({
        where: {
          clubId,
          deletedAt: null,
          memberId,
          type: "INCOME",
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      }),
      db.sessionShare.count({ where: sessionWhere }),
      db.sessionShare.aggregate({
        where: sessionWhere,
        _sum: { amount: true },
      }),
      db.tournamentMember.findMany({
        where: { memberId, tournament: { clubId } },
        include: {
          tournament: {
            select: { id: true, name: true, date: true },
          },
        },
        orderBy: { tournament: { date: "desc" } },
      }),
      db.partyMember.findMany({
        where: { memberId, party: { clubId } },
        include: {
          party: {
            select: { id: true, location: true, date: true, note: true },
          },
        },
        orderBy: { party: { date: "desc" } },
      }),
      loadMemberLedgerRow(clubId, memberId),
    ]);

  const sessionCost = sessionCostAgg._sum.amount ?? 0;
  const sessionTotalPages = Math.max(
    1,
    Math.ceil(sessionCount / MEMBER_HISTORY_SESSION_PAGE_SIZE),
  );
  const currentSessionPage = Math.min(sessionPage, sessionTotalPages);

  if (!ledger) return null;

  const sessionShares = await db.sessionShare.findMany({
    where: sessionWhere,
    include: sessionShareInclude,
    orderBy: { session: { date: "desc" } },
    skip: (currentSessionPage - 1) * MEMBER_HISTORY_SESSION_PAGE_SIZE,
    take: MEMBER_HISTORY_SESSION_PAGE_SIZE,
  });

  const budgetTournamentMembers = tournamentMembers.filter(
    (item) => item.countsToBudget && item.amount > 0,
  );
  const tournamentCost = budgetTournamentMembers.reduce(
    (sum, item) => sum + item.amount,
    0,
  );
  const budgetPartyMembers = partyMembers.filter(
    (item) => item.countsToBudget,
  );
  const partyCost = budgetPartyMembers.reduce(
    (sum, item) => sum + item.amount,
    0,
  );

  return {
    member,
    ledger,
    transactions,
    sessionShares,
    tournamentMembers,
    partyMembers,
    sessionsPagination: {
      page: currentSessionPage,
      pageSize: MEMBER_HISTORY_SESSION_PAGE_SIZE,
      total: sessionCount,
      totalPages: sessionTotalPages,
    },
    stats: {
      sessionCount,
      sessionCost,
      tournamentCost,
      partyCost,
      contributionCount: transactions.filter(
        (tx) => tx.category === "FUND_CONTRIBUTION",
      ).length,
    },
  };
}

export type MemberHistoryData = NonNullable<
  Awaited<ReturnType<typeof getMemberHistory>>
>;
