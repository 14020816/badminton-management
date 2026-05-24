import { isSameDay, subDays, addDays } from "date-fns";

export type PartyMemberAllocation = {
  memberId: string;
  amount: number;
  countsToBudget: boolean;
};

export type PartyMemberAllocationPayload = {
  memberId: string;
  amount: number;
  countsToBudget?: boolean;
};

export type SessionShareForBudgetMatch = {
  date: string | Date;
  shares: { memberName: string; amount: number }[];
};

function startOfDay(date: Date): Date {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function normalizeMemberName(name: string): string {
  const trimmed = name.trim();
  return trimmed === "Sơn" ? "Sơn Lê" : trimmed;
}

function sessionMatchesMemberShare(
  session: SessionShareForBudgetMatch,
  memberName: string,
  amount: number,
): boolean {
  const normalized = normalizeMemberName(memberName);
  return session.shares.some(
    (share) =>
      normalizeMemberName(share.memberName) === normalized &&
      share.amount === amount,
  );
}

export function detectCountsToBudgetFromSessions(input: {
  partyDate: string | Date | null | undefined;
  memberName: string;
  amount: number;
  sessions: SessionShareForBudgetMatch[];
}): boolean {
  if (!input.partyDate) return false;

  const partyDay = startOfDay(new Date(input.partyDate));

  for (const session of input.sessions) {
    const sessionDay = startOfDay(new Date(session.date));
    if (!isSameDay(sessionDay, partyDay)) continue;
    if (sessionMatchesMemberShare(session, input.memberName, input.amount)) {
      return true;
    }
  }

  for (const offset of [-1, 1]) {
    const nearbyDay =
      offset < 0 ? subDays(partyDay, 1) : addDays(partyDay, 1);
    for (const session of input.sessions) {
      const sessionDay = startOfDay(new Date(session.date));
      if (!isSameDay(sessionDay, nearbyDay)) continue;
      if (sessionMatchesMemberShare(session, input.memberName, input.amount)) {
        return true;
      }
    }
  }

  return false;
}

export function parsePartyMemberAllocations(raw: string): PartyMemberAllocation[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Phân bổ thành viên không hợp lệ");
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Chọn ít nhất một thành viên");
  }

  const members: PartyMemberAllocation[] = [];
  const seen = new Set<string>();

  for (const entry of parsed) {
    if (!entry || typeof entry !== "object") {
      throw new Error("Phân bổ thành viên không hợp lệ");
    }

    const row = entry as PartyMemberAllocationPayload;
    const memberId = String(row.memberId ?? "").trim();
    if (!memberId || seen.has(memberId)) continue;
    seen.add(memberId);

    members.push({
      memberId,
      amount: Math.max(0, Math.round(Number(row.amount ?? 0))),
      countsToBudget: Boolean(row.countsToBudget),
    });
  }

  if (members.length === 0) {
    throw new Error("Chọn ít nhất một thành viên");
  }

  return members;
}

export function mergePartyNote(
  eventLabel: string,
  adjustmentNote: string | null | undefined,
): string {
  const label = eventLabel.trim();
  const adjustment = adjustmentNote?.trim();
  if (!adjustment) return label;
  if (!label) return adjustment;
  return `${label} — ${adjustment}`;
}

export function parsePartyDateFromLabel(
  label: string,
  seasonStartYear = 2025,
): Date | null {
  const match = label.match(/(\d{1,2})\/(\d{1,2})/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  if (day < 1 || day > 31 || month < 1 || month > 12) return null;
  const year = month >= 7 ? seasonStartYear : seasonStartYear + 1;
  return new Date(Date.UTC(year, month - 1, day));
}
