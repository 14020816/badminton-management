import * as XLSX from "xlsx";
import path from "path";
import {
  mergePartyNote,
  parsePartyDateFromLabel,
} from "@/lib/domain/parties";
import {
  buildAdditionalNoteFromLegacy,
  calcTournamentShareCost,
} from "@/lib/domain/tournaments";
import {
  EXPENSE_LABEL_TO_CODE,
  INCOME_LABEL_TO_CODE,
  parseCourtType,
  parseExcelSerialDate,
  resolveMemberName,
  toInt,
} from "@/lib/format";

const EXCEL_PATH = path.join(
  process.cwd(),
  "B15-THEO DÕI CHI PHÍ CHƠI CẦU LÔNG.xlsx",
);

const MEMBER_COLUMNS = [
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
] as const;

const MEMBER_NAMES = [
  "Hằng",
  "Lực",
  "Hoàng",
  "Yến",
  "Tuấn",
  "Giới",
  "Trung",
  "Bố anh Trung",
  "Hải Anh",
  "Vân",
  "Hùng",
  "Thích",
  "Sơn Lê",
  "Sơn Trần",
];

function getSheet(name: string): XLSX.WorkSheet {
  const workbook = XLSX.readFile(EXCEL_PATH);
  const sheet = workbook.Sheets[name];
  if (!sheet) throw new Error(`Sheet not found: ${name}`);
  return sheet;
}

function cellValue(sheet: XLSX.WorkSheet, col: string, row: number): unknown {
  const ref = `${col}${row}`;
  return sheet[ref]?.v;
}

function rowHasValue(sheet: XLSX.WorkSheet, row: number, cols: string[]): boolean {
  return cols.some((col) => {
    const val = cellValue(sheet, col, row);
    return val !== undefined && val !== null && val !== "";
  });
}

export function parseMembers() {
  return MEMBER_NAMES.map((name, index) => ({
    name,
    aliases: name === "Sơn Lê" ? ["Sơn"] : [],
    excelColumn: MEMBER_COLUMNS[index],
  }));
}

export function parseSettings() {
  const sheet = getSheet("Theo dõi đánh cầu");
  const pricePerUnit = toInt(cellValue(sheet, "S", 1), 24500);
  const shuttlesPerBlock = 12;
  return {
    shuttleTypes: [
      {
        name: "Mặc định",
        pricePerBlock: pricePerUnit * shuttlesPerBlock,
        shuttlesPerBlock,
        inventory: toInt(cellValue(sheet, "R", 2), 686),
      },
    ],
  };
}

export function parseSessions() {
  const sheet = getSheet("Theo dõi đánh cầu");
  const sessions = [];

  for (let row = 4; row <= 200; row++) {
    const dateSerial = cellValue(sheet, "A", row);
    if (dateSerial === undefined || dateSerial === null || dateSerial === "") continue;

    const shares = MEMBER_NAMES.map((name, index) => ({
      memberName: name,
      amount: toInt(cellValue(sheet, MEMBER_COLUMNS[index], row)),
    })).filter((s) => s.amount > 0);

    sessions.push({
      date: parseExcelSerialDate(Number(dateSerial)),
      courtType: parseCourtType(String(cellValue(sheet, "Q", row) ?? "")),
      shuttlesUsed: toInt(cellValue(sheet, "R", row)),
      courtRental: toInt(cellValue(sheet, "S", row)),
      water: toInt(cellValue(sheet, "T", row)),
      parking: toInt(cellValue(sheet, "U", row)),
      totalCost: toInt(cellValue(sheet, "V", row) || cellValue(sheet, "B", row)),
      costPerPerson: toInt(cellValue(sheet, "W", row)),
      note: String(cellValue(sheet, "X", row) ?? "") || null,
      shares,
    });
  }

  return sessions;
}

export function parseTransactions() {
  const sheet = getSheet("Giao dịch");
  const expenses = [];
  const incomes = [];

  for (let row = 4; row <= 250; row++) {
    const expenseAmount = cellValue(sheet, "C", row);
    if (
      expenseAmount !== undefined &&
      expenseAmount !== null &&
      expenseAmount !== ""
    ) {
      const categoryLabel = String(cellValue(sheet, "F", row) ?? "");
      const dateSerial = cellValue(sheet, "B", row);
      expenses.push({
        date:
          dateSerial !== undefined && dateSerial !== null && dateSerial !== ""
            ? parseExcelSerialDate(Number(dateSerial))
            : null,
        amount: toInt(expenseAmount),
        description: String(cellValue(sheet, "D", row) ?? "") || null,
        quantity: cellValue(sheet, "E", row)
          ? toInt(cellValue(sheet, "E", row))
          : null,
        category: EXPENSE_LABEL_TO_CODE[categoryLabel] ?? "OPTION",
      });
    }

    const incomeAmount = cellValue(sheet, "K", row);
    if (
      incomeAmount !== undefined &&
      incomeAmount !== null &&
      incomeAmount !== ""
    ) {
      const categoryLabel = String(cellValue(sheet, "M", row) ?? "Đóng quỹ");
      const dateSerial = cellValue(sheet, "J", row);
      incomes.push({
        date:
          dateSerial !== undefined && dateSerial !== null && dateSerial !== ""
            ? parseExcelSerialDate(Number(dateSerial))
            : new Date(),
        amount: toInt(incomeAmount),
        memberName: resolveMemberName(String(cellValue(sheet, "L", row) ?? "")),
        category: INCOME_LABEL_TO_CODE[categoryLabel] ?? "FUND_CONTRIBUTION",
        note: String(cellValue(sheet, "N", row) ?? "") || null,
      });
    }
  }

  return { expenses, incomes };
}

export function parseTournament() {
  const sheet = getSheet("Chia bảng thi đấu");
  const brackets = [];
  const rawMembers = [];
  const expenses = [];

  for (let row = 4; row <= 12; row++) {
    if (!rowHasValue(sheet, row, ["D", "E"])) continue;
    brackets.push({
      order: toInt(cellValue(sheet, "C", row), row - 3),
      groupAName: String(cellValue(sheet, "D", row) ?? "") || null,
      groupBName: String(cellValue(sheet, "E", row) ?? "") || null,
      practiceGroupName: String(cellValue(sheet, "M", row) ?? "") || null,
      practiceGroupMembers: String(cellValue(sheet, "O", row) ?? "") || null,
    });
  }

  for (let row = 14; row <= 30; row++) {
    const memberName = String(cellValue(sheet, "C", row) ?? "");
    if (!memberName) continue;

    rawMembers.push({
      memberName: resolveMemberName(memberName),
      beerBetLoss: toInt(cellValue(sheet, "F", row)),
      personalExpensePaid: toInt(cellValue(sheet, "G", row)),
      amountDue: toInt(cellValue(sheet, "H", row)),
    });

    const expenseName = String(cellValue(sheet, "K", row) ?? "");
    if (expenseName) {
      expenses.push({
        expenseName,
        paidBy: String(cellValue(sheet, "L", row) ?? ""),
        amount: toInt(cellValue(sheet, "M", row)),
      });
    }
  }

  const entryFee = 200000;
  const mealCost = toInt(cellValue(sheet, "P", 14), 320000);
  const partyTotal = cellValue(sheet, "P", 13)
    ? toInt(cellValue(sheet, "P", 13))
    : null;
  const partyName = String(cellValue(sheet, "O", 13) ?? "") || null;
  const partyNote = String(cellValue(sheet, "Q", 13) ?? "") || null;
  const shareCost = calcTournamentShareCost({
    entryFee,
    mealCost,
    partyTotal,
    memberCount: rawMembers.length,
  });

  const members = rawMembers.map((member) => {
    const additionalCost = member.beerBetLoss + member.personalExpensePaid;
    return {
      memberName: member.memberName,
      shareCost,
      additionalCost,
      additionalNote: buildAdditionalNoteFromLegacy({
        beerBetLoss: member.beerBetLoss,
        personalExpensePaid: member.personalExpensePaid,
      }),
      amountDue: member.amountDue,
    };
  });

  const noteParts = [partyName, partyNote].filter(Boolean);
  const note = noteParts.length > 0 ? noteParts.join(" — ") : null;

  return {
    name: "Giải đấu B15",
    note,
    brackets,
    members,
    expenses,
  };
}

export function parseParties() {
  const sheet = getSheet("Liên hoan 1804");
  const parties = [];

  const eventLabel1804 = String(
    cellValue(sheet, "D", 1) ?? "Liên hoan: 18/04",
  );
  const adjustmentNote1804 = String(cellValue(sheet, "C", 1) ?? "") || null;
  const date1804 = parsePartyDateFromLabel(eventLabel1804);

  parties.push({
    date: date1804 ? date1804.toISOString().slice(0, 10) : null,
    location: String(cellValue(sheet, "A", 1) ?? "") || null,
    totalCost: toInt(cellValue(sheet, "B", 1)),
    note: mergePartyNote(eventLabel1804, adjustmentNote1804),
    members: [2, 3, 4, 5, 6, 7]
      .map((row) => ({
        memberName: resolveMemberName(String(cellValue(sheet, "E", row) ?? "")),
        amount: toInt(cellValue(sheet, "I", row)),
      }))
      .filter((member) => member.memberName),
  });

  const eventLabel1605 = String(
    cellValue(sheet, "D", 15) ?? "Liên Hoan: 16/05",
  );
  const date1605 = parsePartyDateFromLabel(eventLabel1605);

  parties.push({
    date: date1605 ? date1605.toISOString().slice(0, 10) : null,
    location: null,
    totalCost: 0,
    note: eventLabel1605,
    members: [16, 17, 18, 19]
      .map((row) => ({
        memberName: resolveMemberName(String(cellValue(sheet, "E", row) ?? "")),
        amount: toInt(cellValue(sheet, "K", row)),
      }))
      .filter((member) => member.memberName),
  });

  return parties;
}

export function parseWorkbookSummary() {
  return {
    members: parseMembers(),
    settings: parseSettings(),
    sessions: parseSessions(),
    transactions: parseTransactions(),
    tournament: parseTournament(),
    parties: parseParties(),
  };
}
