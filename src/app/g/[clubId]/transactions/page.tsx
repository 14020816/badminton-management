import { ClubRole } from "@prisma/client";
import { getClubViewAccess } from "@/lib/club-context";
import { getTransactions } from "@/actions/transactions";
import { getMembers } from "@/lib/data/dashboard";
import { TransactionsView } from "@/components/transactions/transactions-view";

export default async function ClubTransactionsPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  const { access } = await getClubViewAccess(clubId);
  const [expenses, incomes, members] = await Promise.all([
    getTransactions(clubId, "EXPENSE"),
    getTransactions(clubId, "INCOME"),
    getMembers(clubId),
  ]);

  return (
    <TransactionsView
      clubId={clubId}
      expenses={expenses}
      incomes={incomes}
      members={members}
      isAdmin={access?.role === ClubRole.ADMIN}
    />
  );
}
