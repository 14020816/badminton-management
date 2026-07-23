"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireClubAdmin, requireClubViewAccess } from "@/lib/club-context";
import {
  buildTournamentSurplusIncomeNote,
  collectTournamentSurplusIncomeNotes,
  finalizeTournamentMembers,
  parseTournamentExpenses,
  parseTournamentMemberAllocations,
  prepareTournamentMemberForSave,
  type ParsedTournamentExpense,
} from "@/lib/domain/tournaments";

function tournamentPaths(clubId: string) {
  return [
    `/g/${clubId}/tournaments`,
    `/g/${clubId}`,
    `/g/${clubId}/transactions`,
    `/g/${clubId}/members`,
  ];
}

function parseTournamentFormData(formData: FormData) {
  const dateRaw = String(formData.get("date") ?? "").trim();
  return {
    date: dateRaw ? new Date(dateRaw) : null,
    note: String(formData.get("note") ?? "").trim() || null,
    members: parseTournamentMemberAllocations(
      String(formData.get("memberAllocations") ?? "[]"),
    ),
    expenses: parseTournamentExpenses(
      String(formData.get("expenseAllocations") ?? "[]"),
    ),
  };
}

async function buildParsedExpenses(
  clubId: string,
  expenses: ReturnType<typeof parseTournamentExpenses>,
): Promise<ParsedTournamentExpense[]> {
  const memberNames = await db.member.findMany({
    where: { clubId },
    select: { id: true, name: true },
  });
  const nameById = new Map(memberNames.map((member) => [member.id, member.name]));

  return expenses.map((expense) => ({
    ...expense,
    paidBy: expense.paidByMemberId
      ? (nameById.get(expense.paidByMemberId) ?? "Không rõ")
      : "Quỹ",
  }));
}

async function loadSurplusIncomeMemberIdsByNote(clubId: string) {
  const incomes = await db.transaction.findMany({
    where: {
      clubId,
      type: "INCOME",
      deletedAt: null,
      note: { startsWith: "Thừa tiền giải đấu-" },
    },
    select: { memberId: true, note: true },
  });

  const byNote = new Map<string, Set<string>>();
  for (const income of incomes) {
    if (!income.memberId || !income.note) continue;
    const linked = byNote.get(income.note) ?? new Set<string>();
    linked.add(income.memberId);
    byNote.set(income.note, linked);
  }

  return byNote;
}

async function syncTournamentSurplusIncomes(
  tx: Pick<typeof db, "transaction">,
  clubId: string,
  tournamentName: string,
  tournamentDate: Date | null,
  creditMembers: { memberId: string; creditAmount: number }[],
) {
  const note = buildTournamentSurplusIncomeNote(tournamentName, tournamentDate);

  for (const member of creditMembers) {
    await tx.transaction.create({
      data: {
        clubId,
        type: "INCOME",
        category: "FUND_CONTRIBUTION",
        memberId: member.memberId,
        amount: member.creditAmount,
        note,
        date: tournamentDate ?? new Date(),
      },
    });
  }
}

export async function createTournamentAction(clubId: string, formData: FormData) {
  await requireClubAdmin(clubId);

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Tên giải không được để trống");

  const { date, note, members } = parseTournamentFormData(formData);

  await db.tournament.create({
    data: {
      clubId,
      name,
      date,
      note,
      members: {
        create: members.map((member) => ({
          memberId: member.memberId,
          shareCost: member.shareCost,
          additionalCost: member.additionalCost,
          additionalNote: member.additionalNote,
          amount: member.amount,
          countsToBudget: member.countsToBudget,
        })),
      },
    },
  });

  tournamentPaths(clubId).forEach((path) => revalidatePath(path));
}

export async function updateTournamentAction(clubId: string, formData: FormData) {
  await requireClubAdmin(clubId);

  const tournamentId = String(formData.get("tournamentId") ?? "");
  const existingTournament = await db.tournament.findFirst({
    where: { id: tournamentId, clubId },
    select: { id: true, name: true, date: true },
  });
  if (!existingTournament) throw new Error("Không tìm thấy giải đấu");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Tên giải không được để trống");

  const { date, note, members, expenses } = parseTournamentFormData(formData);
  const parsedExpenses = await buildParsedExpenses(clubId, expenses);
  const finalizedMembers = finalizeTournamentMembers(members, expenses);
  const preparedMembers = finalizedMembers.map(prepareTournamentMemberForSave);
  const creditMembers = preparedMembers
    .filter((item) => item.applyCreditToBudget)
    .map((item) => ({
      memberId: item.member.memberId,
      creditAmount: item.creditAmount,
    }));
  const surplusNotes = collectTournamentSurplusIncomeNotes([
    { name: existingTournament.name, date: existingTournament.date },
    { name, date },
  ]);

  await db.$transaction(async (tx) => {
    await tx.transaction.updateMany({
      where: {
        clubId,
        type: "INCOME",
        deletedAt: null,
        note: { in: surplusNotes },
      },
      data: { deletedAt: new Date() },
    });

    await tx.tournamentMember.deleteMany({ where: { tournamentId } });
    await tx.tournamentExpense.deleteMany({ where: { tournamentId } });
    await tx.tournament.update({
      where: { id: tournamentId },
      data: {
        name,
        date,
        note,
        members: {
          create: preparedMembers.map(({ member }) => ({
            memberId: member.memberId,
            shareCost: member.shareCost,
            additionalCost: member.additionalCost,
            additionalNote: member.additionalNote,
            amount: member.amount,
            countsToBudget: member.countsToBudget,
          })),
        },
        expenses: {
          create: parsedExpenses.map((expense) => ({
            expenseName: expense.expenseName,
            paidBy: expense.paidBy,
            paidByMemberId: expense.paidByMemberId,
            amount: expense.amount,
            surplusAmount: 0,
            linkSurplusToBudget: false,
          })),
        },
      },
    });

    await syncTournamentSurplusIncomes(
      tx,
      clubId,
      name,
      date,
      creditMembers,
    );
  });

  tournamentPaths(clubId).forEach((path) => revalidatePath(path));
}

export async function deleteTournamentAction(clubId: string, formData: FormData) {
  await requireClubAdmin(clubId);

  const tournamentId = String(formData.get("tournamentId") ?? "");
  const tournament = await db.tournament.findFirst({
    where: { id: tournamentId, clubId },
    select: { id: true, name: true, date: true },
  });
  if (!tournament) throw new Error("Không tìm thấy giải đấu");

  await db.$transaction(async (tx) => {
    await tx.transaction.updateMany({
      where: {
        clubId,
        type: "INCOME",
        deletedAt: null,
        note: {
          in: collectTournamentSurplusIncomeNotes([
            { name: tournament.name, date: tournament.date },
          ]),
        },
      },
      data: { deletedAt: new Date() },
    });
    await tx.tournament.delete({ where: { id: tournamentId } });
  });

  tournamentPaths(clubId).forEach((path) => revalidatePath(path));
}

export async function getTournaments(clubId: string) {
  await requireClubViewAccess(clubId);

  const [tournaments, surplusIncomeByNote] = await Promise.all([
    db.tournament.findMany({
      where: { clubId },
      include: {
        brackets: {
          include: { groupAMember: true, groupBMember: true },
          orderBy: { order: "asc" },
        },
        members: { include: { member: true } },
        expenses: {
          include: { paidByMember: true },
        },
        matches: {
          include: {
            homeMember: true,
            awayMember: true,
            homeMember2: true,
            awayMember2: true,
            sets: { orderBy: { setNumber: "asc" } },
          },
          orderBy: { order: "asc" },
        },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    }),
    loadSurplusIncomeMemberIdsByNote(clubId),
  ]);

  return tournaments.map((tournament) => ({
    ...tournament,
    surplusIncomeMemberIds: Array.from(
      surplusIncomeByNote.get(
        buildTournamentSurplusIncomeNote(tournament.name, tournament.date),
      ) ?? [],
    ),
  }));
}
