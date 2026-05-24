import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { ClubRole, CourtType, PrismaClient } from "@prisma/client";
import { parseCourtType } from "../src/lib/format";
import { calcFundSummary } from "../src/lib/domain/ledger";
import { detectCountsToBudgetFromSessions } from "../src/lib/domain/parties";
import {
  calcTournamentMemberAmount,
  detectCountsToBudgetFromLegacyAmountDue,
} from "../src/lib/domain/tournaments";
import {
  DEFAULT_SHUTTLES_PER_BLOCK,
  legacyUnitPriceToBlock,
} from "../src/lib/domain/shuttle";

const prisma = new PrismaClient();
const DATA_DIR = path.join(process.cwd(), "data");

function readJson<T>(filename: string): T {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Missing ${filePath}. Run "pnpm data:export" first to extract Excel data.`,
    );
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  return new Date(value);
}

type MemberData = { name: string; aliases: string[] };
type ShuttleTypeSeed = {
  name: string;
  pricePerBlock: number;
  shuttlesPerBlock: number;
  inventory: number;
};
type SettingsData =
  | { shuttleTypes: ShuttleTypeSeed[] }
  | { shuttlePricePerUnit: number; shuttleInventory: number };

function resolveShuttleTypes(settings: SettingsData): ShuttleTypeSeed[] {
  if ("shuttleTypes" in settings) return settings.shuttleTypes;
  return [
    {
      name: "Mặc định",
      pricePerBlock: legacyUnitPriceToBlock(
        settings.shuttlePricePerUnit,
        DEFAULT_SHUTTLES_PER_BLOCK,
      ),
      shuttlesPerBlock: DEFAULT_SHUTTLES_PER_BLOCK,
      inventory: settings.shuttleInventory,
    },
  ];
}
type SessionShare = { memberName: string; amount: number };
type SessionData = {
  date: string;
  courtType: CourtType | string | null;
  shuttlesUsed: number;
  courtRental: number;
  water: number;
  parking: number;
  totalCost: number;
  costPerPerson: number;
  note: string | null;
  shares: SessionShare[];
};
type ExpenseData = {
  date: string | null;
  amount: number;
  description: string | null;
  quantity: number | null;
  category: string;
};
type IncomeData = {
  date: string;
  amount: number;
  memberName: string;
  category: string;
  note: string | null;
};
type TournamentData = {
  name: string;
  note: string | null;
  brackets: {
    order: number;
    groupAName: string | null;
    groupBName: string | null;
    practiceGroupName: string | null;
    practiceGroupMembers: string | null;
  }[];
  members: {
    memberName: string;
    shareCost: number;
    additionalCost: number;
    additionalNote: string | null;
    amountDue?: number;
  }[];
  expenses: { expenseName: string; paidBy: string; amount: number }[];
};
type PartyData = {
  date: string | null;
  location: string | null;
  totalCost: number;
  note: string | null;
  members: {
    memberName: string;
    amount: number;
  }[];
};

function resolveMemberName(name: string): string {
  if (name.trim() === "Sơn") return "Sơn Lê";
  return name.trim();
}

async function main() {
  console.log("Loading data from data/*.json...");
  const membersData = readJson<MemberData[]>("members.json");
  const settings = readJson<SettingsData>("settings.json");
  const sessions = readJson<SessionData[]>("sessions.json");
  const { expenses, incomes } = readJson<{
    expenses: ExpenseData[];
    incomes: IncomeData[];
  }>("transactions.json");
  const tournamentData = readJson<TournamentData>("tournament.json");
  const parties = readJson<PartyData[]>("parties.json");
  const manifest = readJson<{ verification: Record<string, number> }>(
    "manifest.json",
  );

  console.log("Seeding admin user...");
  const adminPassword = await bcrypt.hash("admin123", 10);
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@b15.local",
      name: "Thủ quỹ",
      passwordHash: adminPassword,
    },
  });

  const memberPassword = await bcrypt.hash("member123", 10);
  const hangUser = await prisma.user.create({
    data: {
      email: "hang@b15.local",
      name: "Hằng",
      passwordHash: memberPassword,
    },
  });

  const shuttleTypes = resolveShuttleTypes(settings);

  console.log("Creating B15 club...");
  const club = await prisma.club.create({
    data: {
      name: "B15 Cầu lông",
      slug: "b15",
      createdById: adminUser.id,
      settings: { create: {} },
      shuttleTypes: {
        create: shuttleTypes.map((type, index) => ({
          name: type.name,
          pricePerBlock: type.pricePerBlock,
          shuttlesPerBlock: type.shuttlesPerBlock,
          inventory: type.inventory,
          sortOrder: index,
        })),
      },
    },
  });

  const defaultShuttleTypeId = (
    await prisma.shuttleType.findFirst({
      where: { clubId: club.id },
      orderBy: { sortOrder: "asc" },
    })
  )?.id;

  const memberMap = new Map<string, string>();

  console.log("Seeding members...");
  for (const member of membersData) {
    const created = await prisma.member.create({
      data: {
        clubId: club.id,
        name: member.name,
        aliases: member.aliases,
      },
    });
    memberMap.set(member.name, created.id);
    for (const alias of member.aliases) {
      memberMap.set(alias, created.id);
    }
  }

  await prisma.clubMembership.create({
    data: {
      clubId: club.id,
      userId: adminUser.id,
      role: ClubRole.ADMIN,
    },
  });

  const hangMemberId = memberMap.get("Hằng");
  if (hangMemberId) {
    await prisma.clubMembership.create({
      data: {
        clubId: club.id,
        userId: hangUser.id,
        role: ClubRole.MEMBER,
        memberId: hangMemberId,
      },
    });
  }

  console.log("Seeding sessions...");
  for (const session of sessions) {
    await prisma.playSession.create({
      data: {
        clubId: club.id,
        date: parseDate(session.date)!,
        courtType:
          typeof session.courtType === "string"
            ? parseCourtType(session.courtType)
            : session.courtType,
        shuttleTypeId: defaultShuttleTypeId,
        shuttlesUsed: session.shuttlesUsed,
        courtRental: session.courtRental,
        water: session.water,
        parking: session.parking,
        totalCost: session.totalCost,
        costPerPerson: session.costPerPerson,
        note: session.note,
        shares: {
          create: session.shares
            .filter((share) => memberMap.has(share.memberName))
            .map((share) => ({
              memberId: memberMap.get(share.memberName)!,
              amount: share.amount,
            })),
        },
      },
    });
  }

  console.log("Seeding transactions...");
  for (const expense of expenses) {
    await prisma.transaction.create({
      data: {
        clubId: club.id,
        type: "EXPENSE",
        date: parseDate(expense.date),
        amount: expense.amount,
        category: expense.category,
        description: expense.description,
        quantity: expense.quantity,
      },
    });
  }
  for (const income of incomes) {
    const memberId = memberMap.get(income.memberName);
    if (!memberId) {
      console.warn(`Skipping income for unknown member: ${income.memberName}`);
      continue;
    }
    await prisma.transaction.create({
      data: {
        clubId: club.id,
        type: "INCOME",
        date: parseDate(income.date),
        amount: income.amount,
        category: income.category,
        memberId,
        note: income.note,
      },
    });
  }

  console.log("Seeding tournament...");
  const tournament = await prisma.tournament.create({
    data: {
      clubId: club.id,
      name: tournamentData.name,
      note: tournamentData.note,
      brackets: {
        create: tournamentData.brackets.map((b) => ({
          order: b.order,
          groupAMemberId: b.groupAName
            ? memberMap.get(resolveMemberName(b.groupAName)) ?? null
            : null,
          groupBMemberId: b.groupBName
            ? memberMap.get(resolveMemberName(b.groupBName)) ?? null
            : null,
          practiceGroupName: b.practiceGroupName,
          practiceGroupMembers: b.practiceGroupMembers,
        })),
      },
      members: {
        create: tournamentData.members
          .filter((member) => memberMap.has(member.memberName))
          .map((member) => ({
            memberId: memberMap.get(member.memberName)!,
            shareCost: member.shareCost,
            additionalCost: member.additionalCost,
            additionalNote: member.additionalNote,
            amount: calcTournamentMemberAmount({
              shareCost: member.shareCost,
              additionalCost: member.additionalCost,
            }),
            countsToBudget: detectCountsToBudgetFromLegacyAmountDue(
              member.amountDue ?? 0,
            ),
          })),
      },
      expenses: {
        create: tournamentData.expenses,
      },
    },
  });

  console.log("Seeding parties...");
  const sessionsForBudgetMatch = sessions.map((session) => ({
    date: session.date,
    shares: session.shares,
  }));

  for (const party of parties) {
    const partyDate = parseDate(party.date);
    const partyMembers = party.members
      .filter((member) => memberMap.has(member.memberName))
      .map((member) => ({
        memberId: memberMap.get(member.memberName)!,
        amount: member.amount,
        countsToBudget: detectCountsToBudgetFromSessions({
          partyDate,
          memberName: member.memberName,
          amount: member.amount,
          sessions: sessionsForBudgetMatch,
        }),
      }));

    await prisma.party.create({
      data: {
        clubId: club.id,
        date: partyDate,
        location: party.location,
        totalCost: party.totalCost,
        note: party.note,
        members: {
          create: partyMembers,
        },
      },
    });
  }

  const allTransactions = await prisma.transaction.findMany({
    where: { clubId: club.id },
    select: { type: true, amount: true, category: true, memberId: true },
  });
  const summary = calcFundSummary(allTransactions);
  const sessionCount = await prisma.playSession.count({
    where: { clubId: club.id },
  });
  const expenseCount = await prisma.transaction.count({
    where: { clubId: club.id, type: "EXPENSE" },
  });
  const incomeCount = await prisma.transaction.count({
    where: { clubId: club.id, type: "INCOME" },
  });

  const expected = manifest.verification;

  console.log("\nVerification:");
  console.log(
    `Sessions: ${sessionCount} (expected ${expected.sessionCount}) ${sessionCount === expected.sessionCount ? "OK" : "MISMATCH"}`,
  );
  console.log(
    `Expenses: ${expenseCount} (expected ${expected.expenseTransactionCount}) ${expenseCount === expected.expenseTransactionCount ? "OK" : "MISMATCH"}`,
  );
  console.log(
    `Incomes: ${incomeCount} (expected ${expected.incomeTransactionCount}) ${incomeCount === expected.incomeTransactionCount ? "OK" : "MISMATCH"}`,
  );
  console.log(
    `Total expense: ${summary.totalExpense} (expected ${expected.totalExpense}) ${summary.totalExpense === expected.totalExpense ? "OK" : "MISMATCH"}`,
  );
  console.log(
    `Total income: ${summary.totalIncome} (expected ${expected.totalIncome}) ${summary.totalIncome === expected.totalIncome ? "OK" : "MISMATCH"}`,
  );
  console.log(
    `Fund balance: ${summary.fundBalance} (expected ${expected.fundBalance}) ${summary.fundBalance === expected.fundBalance ? "OK" : "MISMATCH"}`,
  );
  console.log(`Club ID: ${club.id}`);
  console.log(`Tournament ID: ${tournament.id}`);
  console.log(`Admin login: admin@b15.local / admin123`);
  console.log(`Member login: hang@b15.local / member123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
