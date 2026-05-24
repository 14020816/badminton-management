import { formatDate } from "@/lib/format";

export type TournamentMemberAllocation = {
  memberId: string;
  shareCost: number;
  additionalCost: number;
  additionalNote: string | null;
  amount: number;
  countsToBudget: boolean;
};

export type TournamentMemberAllocationPayload = {
  memberId: string;
  shareCost: number;
  additionalCost?: number;
  additionalNote?: string | null;
  countsToBudget?: boolean;
};

export function calcTournamentMemberAmount(input: {
  shareCost: number;
  additionalCost: number;
  memberPaidExpense?: number;
}): number {
  return Math.round(
    Number(input.shareCost ?? 0) +
      Number(input.additionalCost ?? 0) -
      Number(input.memberPaidExpense ?? 0),
  );
}

export function calcTournamentMemberCredit(amount: number): number {
  return amount < 0 ? Math.abs(amount) : 0;
}

export function buildTournamentSurplusIncomeNote(
  tournamentName: string,
  tournamentDate?: Date | string | null,
): string {
  const name = tournamentName.trim();
  const dateLabel = tournamentDate ? formatDate(tournamentDate) : "Không rõ ngày";
  return `Thừa tiền giải đấu- ${name} - ${dateLabel}`;
}

export function buildLegacyTournamentSurplusIncomeNote(
  tournamentName: string,
): string {
  return `Thừa tiền giải đấu- ${tournamentName.trim()}`;
}

export function collectTournamentSurplusIncomeNotes(input: {
  name: string;
  date: Date | null;
}[]): string[] {
  const notes = new Set<string>();
  for (const tournament of input) {
    notes.add(buildTournamentSurplusIncomeNote(tournament.name, tournament.date));
    notes.add(buildLegacyTournamentSurplusIncomeNote(tournament.name));
  }
  return Array.from(notes);
}

export function prepareTournamentMemberForSave(
  member: TournamentMemberAllocation,
): {
  member: TournamentMemberAllocation;
  applyCreditToBudget: boolean;
  creditAmount: number;
} {
  const creditAmount = calcTournamentMemberCredit(member.amount);
  const applyCreditToBudget = creditAmount > 0 && member.countsToBudget;

  return {
    member: {
      ...member,
      countsToBudget: applyCreditToBudget
        ? false
        : member.amount !== 0 && member.countsToBudget,
    },
    applyCreditToBudget,
    creditAmount,
  };
}

export function calcTournamentExpenseTotal(
  expenses: { expenseName?: string; amount: number }[],
): number {
  return expenses.reduce((sum, expense) => {
    if (expense.expenseName !== undefined && !expense.expenseName.trim()) {
      return sum;
    }
    return sum + Math.max(0, Math.round(Number(expense.amount ?? 0)));
  }, 0);
}

export function calcTournamentShareCostPerMember(
  totalExpense: number,
  memberCount: number,
): number {
  if (memberCount <= 0) return 0;
  return Math.round(Math.max(0, totalExpense) / memberCount);
}

export function memberPaidExpenseTotalByMember(
  expenses: {
    paidByMemberId: string | null;
    amount: number;
    expenseName?: string;
  }[],
): Map<string, number> {
  const paidByMember = new Map<string, number>();

  for (const expense of expenses) {
    if (!expense.paidByMemberId) continue;
    if (expense.expenseName !== undefined && !expense.expenseName.trim()) {
      continue;
    }

    paidByMember.set(
      expense.paidByMemberId,
      (paidByMember.get(expense.paidByMemberId) ?? 0) +
        Math.max(0, Math.round(Number(expense.amount ?? 0))),
    );
  }

  return paidByMember;
}

export function finalizeTournamentMembers(
  members: TournamentMemberAllocation[],
  expenses: TournamentExpensePayload[],
): TournamentMemberAllocation[] {
  const shareCost = calcTournamentShareCostPerMember(
    calcTournamentExpenseTotal(expenses),
    members.length,
  );
  const paidByMember = memberPaidExpenseTotalByMember(expenses);

  return members.map((member) => {
    const memberPaidExpense = paidByMember.get(member.memberId) ?? 0;
    const amount = calcTournamentMemberAmount({
      shareCost,
      additionalCost: member.additionalCost,
      memberPaidExpense,
    });

    return {
      ...member,
      shareCost,
      amount,
      countsToBudget: amount !== 0 && member.countsToBudget,
    };
  });
}

export function buildAdditionalNoteFromLegacy(input: {
  beerBetLoss?: number;
  personalExpensePaid?: number;
}): string | null {
  const parts: string[] = [];
  if ((input.beerBetLoss ?? 0) > 0) parts.push("Thua kèo bia");
  if ((input.personalExpensePaid ?? 0) > 0) parts.push("Tiền đã chi mua đồ");
  return parts.length > 0 ? parts.join(" — ") : null;
}

export function calcTournamentShareCost(input: {
  entryFee: number;
  mealCost: number;
  partyTotal?: number | null;
  memberCount: number;
}): number {
  const base = Math.max(0, input.entryFee) + Math.max(0, input.mealCost);
  const partyShare =
    input.partyTotal && input.partyTotal > 0 && input.memberCount > 0
      ? Math.round(input.partyTotal / input.memberCount)
      : 0;
  return base + partyShare;
}

export function parseTournamentMemberAllocations(
  raw: string,
): TournamentMemberAllocation[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Phân bổ thành viên không hợp lệ");
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Chọn ít nhất một thành viên");
  }

  const members: TournamentMemberAllocation[] = [];
  const seen = new Set<string>();

  for (const entry of parsed) {
    if (!entry || typeof entry !== "object") {
      throw new Error("Phân bổ thành viên không hợp lệ");
    }

    const row = entry as TournamentMemberAllocationPayload;
    const memberId = String(row.memberId ?? "").trim();
    if (!memberId || seen.has(memberId)) continue;
    seen.add(memberId);

    const additionalCost = Math.max(
      0,
      Math.round(Number(row.additionalCost ?? 0)),
    );
    const additionalNote = String(row.additionalNote ?? "").trim() || null;

    members.push({
      memberId,
      shareCost: 0,
      additionalCost,
      additionalNote,
      amount: additionalCost,
      countsToBudget: Boolean(row.countsToBudget),
    });
  }

  if (members.length === 0) {
    throw new Error("Chọn ít nhất một thành viên");
  }

  return members;
}

export function detectCountsToBudgetFromLegacyAmountDue(
  amountDue: number,
): boolean {
  return amountDue > 0;
}

export const CLUB_FUND_PAYER_VALUE = "__club_fund__";

export type TournamentExpensePayload = {
  expenseName: string;
  paidByMemberId: string | null;
  amount: number;
};

export type ParsedTournamentExpense = TournamentExpensePayload & {
  paidBy: string;
};

export function parseTournamentExpenses(raw: string): TournamentExpensePayload[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Danh sách chi phí giải không hợp lệ");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Danh sách chi phí giải không hợp lệ");
  }

  const expenses: TournamentExpensePayload[] = [];

  for (const entry of parsed) {
    if (!entry || typeof entry !== "object") continue;

    const row = entry as Partial<TournamentExpensePayload> & {
      paidByMemberId?: string | null;
    };
    const expenseName = String(row.expenseName ?? "").trim();
    if (!expenseName) continue;

    const paidByRaw = row.paidByMemberId;
    const paidByMemberId =
      paidByRaw &&
      String(paidByRaw).trim() &&
      String(paidByRaw).trim() !== CLUB_FUND_PAYER_VALUE
        ? String(paidByRaw).trim()
        : null;

    expenses.push({
      expenseName,
      paidByMemberId,
      amount: Math.max(0, Math.round(Number(row.amount ?? 0))),
    });
  }

  return expenses;
}

export function linkedTournamentExpenseSurplusByMember(
  expenses: {
    paidByMemberId: string | null;
    surplusAmount: number;
    linkSurplusToBudget: boolean;
  }[],
): Map<string, number> {
  const surplusByMember = new Map<string, number>();

  for (const expense of expenses) {
    if (
      !expense.paidByMemberId ||
      !expense.linkSurplusToBudget ||
      expense.surplusAmount <= 0
    ) {
      continue;
    }

    surplusByMember.set(
      expense.paidByMemberId,
      (surplusByMember.get(expense.paidByMemberId) ?? 0) + expense.surplusAmount,
    );
  }

  return surplusByMember;
}

/** @deprecated Use finalizeTournamentMembers */
export const enrichTournamentMembersWithShareCost = finalizeTournamentMembers;
