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

export function calcSharedSessionBase(input: SessionCostInput): number {
  return (
    input.courtRental +
    calcShuttleCost(input.shuttlesUsed, input.shuttlePricing)
  );
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
  sharedBase: number,
  members: MemberShareInput[],
): ComputedSessionShare[] {
  return calcSessionAllocations(sharedBase, members, []).shares;
}

export function calcSessionAllocations(
  sharedBase: number,
  members: MemberShareInput[],
  guests: GuestShareInput[],
): { shares: ComputedSessionShare[]; guests: ComputedSessionGuest[] } {
  const attendeeCount = members.length + guests.length;
  if (attendeeCount === 0) return { shares: [], guests: [] };

  const basePerPerson = calcCostPerPerson(sharedBase, attendeeCount);
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
      : basePerPerson + extras.water + extras.parking + extras.extra;
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
    const hostedGuests = guests.filter(
      (guest) => guest.hostedByMemberId === member.memberId,
    );

    let hostedShare = 0;
    let hostedExtras = 0;
    if (memberPaysForGuests) {
      hostedShare = basePerPerson * hostedGuests.length;
      for (const guest of hostedGuests) {
        const guestExtras = normalizeExtras(guest);
        hostedExtras +=
          guestExtras.water + guestExtras.parking + guestExtras.extra;
      }
    }

    const defaultAmount =
      basePerPerson +
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
  sharedBasePerPerson: number,
  row: Pick<ShareAllocationPayload, "water" | "parking" | "extra">,
): number {
  return (
    sharedBasePerPerson +
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
