import type { CourtType } from "@prisma/client";

export type EditableSession = {
  id: string;
  date: Date;
  courtType: CourtType | null;
  courtRental: number;
  shuttlesUsed: number;
  shuttleTypeId: string | null;
  shuttlePricePerBlock: number | null;
  scheduleId: string | null;
  address: string | null;
  googleAddressUrl: string | null;
  note: string | null;
  shares: {
    memberId: string;
    amount: number;
    water?: number;
    parking?: number;
    extra?: number;
    extraNote?: string | null;
    memberPaysForGuests?: boolean;
    paysShuttleCost?: boolean;
  }[];
  guests: {
    id: string;
    name: string;
    amount: number;
    water?: number;
    parking?: number;
    extra?: number;
    extraNote?: string | null;
    hostedByMemberId?: string | null;
  }[];
};

type SessionLike = {
  id: string;
  date: Date;
  courtType: CourtType | null;
  courtRental: number;
  shuttlesUsed: number;
  shuttleTypeId: string | null;
  shuttlePricePerBlock: number | null;
  scheduleId: string | null;
  address: string | null;
  googleAddressUrl: string | null;
  note: string | null;
  shares: EditableSession["shares"];
  guests: EditableSession["guests"];
};

export function buildSessionEditPath(clubId: string, sessionId: string) {
  return `/g/${clubId}/sessions/${sessionId}/edit`;
}

export function toEditableSession(session: SessionLike): EditableSession {
  return {
    id: session.id,
    date: session.date,
    courtType: session.courtType,
    courtRental: session.courtRental,
    shuttlesUsed: session.shuttlesUsed,
    shuttleTypeId: session.shuttleTypeId,
    shuttlePricePerBlock: session.shuttlePricePerBlock,
    scheduleId: session.scheduleId,
    address: session.address,
    googleAddressUrl: session.googleAddressUrl,
    note: session.note,
    shares: session.shares.map((share) => ({
      memberId: share.memberId,
      amount: share.amount,
      water: share.water,
      parking: share.parking,
      extra: share.extra,
      extraNote: share.extraNote,
      memberPaysForGuests: share.memberPaysForGuests,
      paysShuttleCost: share.paysShuttleCost,
    })),
    guests: session.guests.map((guest) => ({
      id: guest.id,
      name: guest.name,
      amount: guest.amount,
      water: guest.water,
      parking: guest.parking,
      extra: guest.extra,
      extraNote: guest.extraNote,
      hostedByMemberId: guest.hostedByMemberId,
    })),
  };
}
