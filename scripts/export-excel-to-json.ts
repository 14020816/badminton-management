import fs from "fs";
import path from "path";
import { parseWorkbookSummary } from "../src/lib/excel/parser";

const DATA_DIR = path.join(process.cwd(), "data");
const SOURCE_FILE = "B15-THEO DÕI CHI PHÍ CHƠI CẦU LÔNG.xlsx";

function serializeDates(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map(serializeDates);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [key, serializeDates(val)]),
    );
  }
  return value;
}

function writeJson(filename: string, data: unknown) {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
  console.log(`Wrote ${filePath}`);
}

function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const workbook = parseWorkbookSummary();
  const serialized = serializeDates(workbook) as ReturnType<
    typeof parseWorkbookSummary
  >;

  writeJson("members.json", serialized.members);
  writeJson("settings.json", serialized.settings);
  writeJson("sessions.json", serialized.sessions);
  writeJson("transactions.json", serialized.transactions);
  writeJson("tournament.json", serialized.tournament);
  writeJson("parties.json", serialized.parties);

  const manifest = {
    sourceFile: SOURCE_FILE,
    exportedAt: new Date().toISOString(),
    counts: {
      members: serialized.members.length,
      sessions: serialized.sessions.length,
      expenses: serialized.transactions.expenses.length,
      incomes: serialized.transactions.incomes.length,
      parties: serialized.parties.length,
      tournamentBrackets: serialized.tournament.brackets.length,
      tournamentMembers: serialized.tournament.members.length,
      tournamentExpenses: serialized.tournament.expenses.length,
    },
    verification: {
      sessionCount: 94,
      expenseTransactionCount: 172,
      incomeTransactionCount: 91,
      totalExpense: 41016000,
      totalIncome: 42081000,
      fundBalance: 1065000,
    },
  };

  writeJson("manifest.json", manifest);

  console.log("\nExport summary:");
  console.log(JSON.stringify(manifest.counts, null, 2));
}

main();
