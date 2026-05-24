import { EXPENSE_CATEGORY_LABELS } from "@/lib/format";

export interface TransactionRow {
  type: "EXPENSE" | "INCOME";
  amount: number;
  category: string;
  memberId?: string | null;
}

export interface SessionShareRow {
  memberId: string;
  amount: number;
}

export interface FundSummary {
  totalExpense: number;
  totalIncome: number;
  fundBalance: number;
}

export interface ExpenseBreakdownItem {
  category: string;
  label: string;
  total: number;
}

export interface MemberLedgerRow {
  memberId: string;
  memberName: string;
  totalPaid: number;
  totalPlayCost: number;
  remainingBalance: number;
}

export function calcFundSummary(
  transactions: TransactionRow[],
): FundSummary {
  const totalExpense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    totalExpense,
    totalIncome,
    fundBalance: totalIncome - totalExpense,
  };
}

export function calcExpenseBreakdown(
  transactions: TransactionRow[],
): ExpenseBreakdownItem[] {
  const totals = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.type !== "EXPENSE") continue;
    totals.set(tx.category, (totals.get(tx.category) ?? 0) + tx.amount);
  }

  return Array.from(totals.entries())
    .map(([category, total]) => ({
      category,
      label: EXPENSE_CATEGORY_LABELS[category] ?? category,
      total,
    }))
    .sort((a, b) => b.total - a.total);
}

export function calcMemberLedger(
  members: { id: string; name: string }[],
  transactions: TransactionRow[],
  sessionShares: SessionShareRow[],
  tournamentCosts: { memberId: string; amount: number }[] = [],
  partyCosts: { memberId: string; amount: number }[] = [],
): MemberLedgerRow[] {
  return members.map((member) => {
    const totalPaid = transactions
      .filter(
        (t) =>
          t.type === "INCOME" &&
          t.category === "FUND_CONTRIBUTION" &&
          t.memberId === member.id,
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const sessionCost = sessionShares
      .filter((s) => s.memberId === member.id)
      .reduce((sum, s) => sum + s.amount, 0);

    const tournamentCost = tournamentCosts
      .filter((c) => c.memberId === member.id)
      .reduce((sum, c) => sum + c.amount, 0);

    const partyCost = partyCosts
      .filter((c) => c.memberId === member.id)
      .reduce((sum, c) => sum + c.amount, 0);

    const totalPlayCost = sessionCost + tournamentCost + partyCost;

    return {
      memberId: member.id,
      memberName: member.name,
      totalPaid,
      totalPlayCost,
      remainingBalance: totalPaid - totalPlayCost,
    };
  });
}
