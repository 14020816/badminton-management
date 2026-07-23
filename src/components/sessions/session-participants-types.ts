import type { CourtType } from "@prisma/client";

export type SessionParticipantsData = {
  date: Date;
  courtType: CourtType | null;
  shuttleTypeName?: string | null;
  shuttlesUsed?: number;
  totalCost: number;
  shares: {
    memberId: string;
    member: { name: string };
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
    hostedBy?: { id: string; name: string } | null;
  }[];
};

export function formatGuestDisplayName(name: string | null | undefined) {
  const trimmed = name?.trim();
  return trimmed || "Khách";
}

export function summarizeSessionParticipants(session: {
  shares: SessionParticipantsData["shares"];
  guests: SessionParticipantsData["guests"];
}) {
  const memberCount = session.shares.length;
  const guestCount = session.guests.length;
  return {
    memberCount,
    guestCount,
    total: memberCount + guestCount,
  };
}
