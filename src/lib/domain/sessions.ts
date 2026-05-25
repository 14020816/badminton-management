import {
  calcShuttleCost,
  type ShuttleTypePricing,
} from "@/lib/domain/shuttle";

export interface SessionCostInput {
  courtRental: number;
  shuttlesUsed: number;
  shuttlePricing: ShuttleTypePricing;
}

export type MemberShareInput = {
  memberId: string;
  memberPaysForGuests?: boolean;
  paysShuttleCost?: boolean;
  water?: number;
  parking?: number;
  extra?: number;
  extraNote?: string | null;
  amount?: number | null;
};

export type GuestShareInput = {
  name: string;
  hostedByMemberId?: string | null;
  water?: number;
  parking?: number;
  extra?: number;
  extraNote?: string | null;
  amount?: number | null;
};

export type ComputedSessionShare = {
  memberId: string;
  amount: number;
  water: number;
  parking: number;
  extra: number;
  extraNote: string | null;
  memberPaysForGuests: boolean;
  paysShuttleCost: boolean;
};

export type ComputedSessionGuest = {
  name: string;
  hostedByMemberId: string | null;
  amount: number;
  water: number;
  parking: number;
  extra: number;
  extraNote: string | null;
};

export type SessionCostParts = {
  courtRental: number;
  shuttleCost: number;
};

export type SessionPerPersonCosts = {
  courtPerPerson: number;
  shuttlePerPerson: number;
  courtPayers: number;
  shuttlePayers: number;
};

export function calcSessionCostParts(input: SessionCostInput): SessionCostParts {
  return {
    courtRental: input.courtRental,
    shuttleCost: calcShuttleCost(input.shuttlesUsed, input.shuttlePricing),
  };
}

export function calcSharedSessionBase(input: SessionCostInput): number {
  const { courtRental, shuttleCost } = calcSessionCostParts(input);
  return courtRental + shuttleCost;
}

/** @deprecated Use calcSharedSessionBase — session water/parking are per-member now */
export function calcSessionTotal(
  input: SessionCostInput & { water?: number; parking?: number },
): number {
  return (
    calcSharedSessionBase(input) + (input.water ?? 0) + (input.parking ?? 0)
  );
}

export function calcCostPerPerson(
  totalCost: number,
  attendeeCount: number,
): number {
  if (attendeeCount <= 0) return 0;
  return Math.round(totalCost / attendeeCount);
}

function guestPaysDirectly(
  guest: GuestShareInput,
  memberPaysMap: Map<string, boolean>,
): boolean {
  if (!guest.hostedByMemberId) return true;
  return !(memberPaysMap.get(guest.hostedByMemberId) ?? false);
}

export function calcSessionPerPersonCosts(
  costInput: SessionCostInput,
  members: MemberShareInput[],
  guests: GuestShareInput[],
): SessionPerPersonCosts {
  const { courtRental, shuttleCost } = calcSessionCostParts(costInput);
  const memberPaysMap = new Map(
    members.map((member) => [
      member.memberId,
      member.memberPaysForGuests ?? false,
    ]),
  );

  let courtPayers = members.length;
  let shuttlePayers = members.filter(
    (member) => member.paysShuttleCost !== false,
  ).length;

  for (const guest of guests) {
    if (!guestPaysDirectly(guest, memberPaysMap)) continue;
    courtPayers += 1;
    shuttlePayers += 1;
  }

  return {
    courtPayers,
    shuttlePayers,
    courtPerPerson: calcCostPerPerson(courtRental, courtPayers),
    shuttlePerPerson: calcCostPerPerson(shuttleCost, shuttlePayers),
  };
}

export function calcMemberBaseShare(
  perPerson: SessionPerPersonCosts,
  paysShuttleCost: boolean,
): number {
  return (
    perPerson.courtPerPerson +
    (paysShuttleCost !== false ? perPerson.shuttlePerPerson : 0)
  );
}

export function calcGuestBaseShare(perPerson: SessionPerPersonCosts): number {
  return perPerson.courtPerPerson + perPerson.shuttlePerPerson;
}

export function calcEvenShares(
  totalCost: number,
  attendeeMemberIds: string[],
): { memberId: string; amount: number }[] {
  const count = attendeeMemberIds.length;
  if (count === 0) return [];
  const perPerson = calcCostPerPerson(totalCost, count);
  return attendeeMemberIds.map((memberId) => ({
    memberId,
    amount: perPerson,
  }));
}

function normalizeExtras(input: {
  water?: number;
  parking?: number;
  extra?: number;
  extraNote?: string | null;
}) {
  return {
    water: Math.max(0, Math.round(input.water ?? 0)),
    parking: Math.max(0, Math.round(input.parking ?? 0)),
    extra: Math.max(0, Math.round(input.extra ?? 0)),
    extraNote: input.extraNote?.trim() || null,
  };
}

export function calcMemberShares(
  costInput: SessionCostInput,
  members: MemberShareInput[],
): ComputedSessionShare[] {
  return calcSessionAllocations(costInput, members, []).shares;
}

export function calcSessionAllocations(
  costInput: SessionCostInput,
  members: MemberShareInput[],
  guests: GuestShareInput[],
): { shares: ComputedSessionShare[]; guests: ComputedSessionGuest[] } {
  const attendeeCount = members.length + guests.length;
  if (attendeeCount === 0) return { shares: [], guests: [] };

  const perPerson = calcSessionPerPersonCosts(costInput, members, guests);
  const memberPaysMap = new Map(
    members.map((member) => [
      member.memberId,
      member.memberPaysForGuests ?? false,
    ]),
  );

  const computedGuests: ComputedSessionGuest[] = guests.map((guest) => {
    const name = String(guest.name ?? "").trim();
    const hostedByMemberId = guest.hostedByMemberId?.trim() || null;
    const memberPaysForGuests = hostedByMemberId
      ? (memberPaysMap.get(hostedByMemberId) ?? false)
      : false;
    const extras = normalizeExtras(guest);

    const defaultAmount = memberPaysForGuests
      ? 0
      : calcGuestBaseShare(perPerson) +
        extras.water +
        extras.parking +
        extras.extra;
    const amount =
      guest.amount != null && Number.isFinite(guest.amount)
        ? Math.max(0, Math.round(guest.amount))
        : defaultAmount;

    return {
      name,
      hostedByMemberId,
      amount,
      water: memberPaysForGuests ? 0 : extras.water,
      parking: memberPaysForGuests ? 0 : extras.parking,
      extra: memberPaysForGuests ? 0 : extras.extra,
      extraNote: memberPaysForGuests ? null : extras.extraNote,
    };
  });

  const shares: ComputedSessionShare[] = members.map((member) => {
    const extras = normalizeExtras(member);
    const memberPaysForGuests = member.memberPaysForGuests ?? false;
    const paysShuttleCost = member.paysShuttleCost !== false;
    const hostedGuests = guests.filter(
      (guest) => guest.hostedByMemberId === member.memberId,
    );

    let hostedShare = 0;
    let hostedExtras = 0;
    if (memberPaysForGuests) {
      hostedShare = calcGuestBaseShare(perPerson) * hostedGuests.length;
      for (const guest of hostedGuests) {
        const guestExtras = normalizeExtras(guest);
        hostedExtras +=
          guestExtras.water + guestExtras.parking + guestExtras.extra;
      }
    }

    const defaultAmount =
      calcMemberBaseShare(perPerson, paysShuttleCost) +
      hostedShare +
      hostedExtras +
      extras.water +
      extras.parking +
      extras.extra;
    const amount =
      member.amount != null && Number.isFinite(member.amount)
        ? Math.max(0, Math.round(member.amount))
        : defaultAmount;

    return {
      memberId: member.memberId,
      amount,
      water: extras.water,
      parking: extras.parking,
      extra: extras.extra,
      extraNote: extras.extraNote,
      memberPaysForGuests,
      paysShuttleCost,
    };
  });

  return { shares, guests: computedGuests };
}

export function sumSessionShareTotals(
  shares: ComputedSessionShare[],
  guests: ComputedSessionGuest[] = [],
) {
  const totalCost =
    shares.reduce((sum, share) => sum + share.amount, 0) +
    guests.reduce((sum, guest) => sum + guest.amount, 0);
  const water =
    shares.reduce((sum, share) => sum + share.water, 0) +
    guests.reduce((sum, guest) => sum + guest.water, 0);
  const parking =
    shares.reduce((sum, share) => sum + share.parking, 0) +
    guests.reduce((sum, guest) => sum + guest.parking, 0);
  const attendeeCount = shares.length + guests.length;
  const costPerPerson =
    attendeeCount > 0 ? Math.round(totalCost / attendeeCount) : 0;

  return { totalCost, water, parking, costPerPerson };
}

export function mergeSharesWithOverrides(
  evenShares: { memberId: string; amount: number }[],
  overrides: Record<string, number>,
): { memberId: string; amount: number }[] {
  const map = new Map(evenShares.map((s) => [s.memberId, s.amount]));
  for (const [memberId, amount] of Object.entries(overrides)) {
    map.set(memberId, amount);
  }
  return Array.from(map.entries()).map(([memberId, amount]) => ({
    memberId,
    amount,
  }));
}

export type ShareAllocationPayload = {
  memberId: string;
  water: number;
  parking: number;
  extra: number;
  extraNote: string | null;
  amount: number | null;
  amountCustom?: boolean;
  memberPaysForGuests?: boolean;
  paysShuttleCost?: boolean;
};

export type GuestAllocationPayload = {
  clientId: string;
  name: string;
  hostedByMemberId: string | null;
  water: number;
  parking: number;
  extra: number;
  extraNote: string | null;
  amount: number | null;
  amountCustom?: boolean;
};

export function parseShareAllocations(raw: string): MemberShareInput[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Phân bổ thành viên không hợp lệ");
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Chọn ít nhất một người tham gia");
  }

  const members: MemberShareInput[] = [];
  const seen = new Set<string>();

  for (const entry of parsed) {
    if (!entry || typeof entry !== "object") {
      throw new Error("Phân bổ thành viên không hợp lệ");
    }

    const row = entry as ShareAllocationPayload;
    const memberId = String(row.memberId ?? "").trim();
    if (!memberId || seen.has(memberId)) continue;
    seen.add(memberId);

    members.push({
      memberId,
      memberPaysForGuests: Boolean(row.memberPaysForGuests),
      paysShuttleCost: row.paysShuttleCost !== false,
      water: Number(row.water ?? 0),
      parking: Number(row.parking ?? 0),
      extra: Number(row.extra ?? 0),
      extraNote: row.extraNote?.trim() || null,
      amount: row.amountCustom ? Number(row.amount ?? 0) : null,
    });
  }

  if (members.length === 0) {
    throw new Error("Chọn ít nhất một người tham gia");
  }

  return members;
}

export function parseGuestAllocations(raw: string): GuestShareInput[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Phân bổ khách không hợp lệ");
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  const guests: GuestShareInput[] = [];

  for (const entry of parsed) {
    if (!entry || typeof entry !== "object") continue;

    const row = entry as GuestAllocationPayload;
    const name = String(row.name ?? "").trim();
    if (!name) {
      throw new Error("Nhập tên cho tất cả khách tham gia");
    }

    guests.push({
      name,
      hostedByMemberId: row.hostedByMemberId?.trim() || null,
      water: Number(row.water ?? 0),
      parking: Number(row.parking ?? 0),
      extra: Number(row.extra ?? 0),
      extraNote: row.extraNote?.trim() || null,
      amount: row.amountCustom ? Number(row.amount ?? 0) : null,
    });
  }

  return guests;
}

export function defaultShareAmount(
  basePerPerson: number,
  row: Pick<ShareAllocationPayload, "water" | "parking" | "extra">,
): number {
  return (
    basePerPerson +
    Math.max(0, row.water) +
    Math.max(0, row.parking) +
    Math.max(0, row.extra)
  );
}

export function attendeeCount(
  members: ShareAllocationPayload[],
  guests: GuestAllocationPayload[],
): number {
  return members.length + guests.length;
}
