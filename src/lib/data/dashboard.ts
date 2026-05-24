import { db } from "@/lib/db";
import {
  calcExpenseBreakdown,
  calcFundSummary,
} from "@/lib/domain/ledger";
import { loadClubMemberLedger } from "@/lib/data/member-ledger";
import { getUpcomingOccurrences } from "@/lib/domain/schedule";
import type { CourtType } from "@prisma/client";

export type DashboardUpcomingItem =
  | {
      kind: "session";
      sessionId: string;
      date: string;
      courtType: CourtType | null;
      startTime: string | null;
      endTime: string | null;
      isScheduled: boolean;
      note: string | null;
      address: string | null;
      googleAddressUrl: string | null;
      attendeeCount: number;
    }
  | {
      kind: "schedule";
      scheduleId: string;
      date: string;
      startTime: string;
      endTime: string;
      courtType: CourtType;
      address: string | null;
      googleAddressUrl: string | null;
    };

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

async function getUpcomingDashboardItem(
  clubId: string,
): Promise<DashboardUpcomingItem | null> {
  const todayStart = startOfToday();

  const upcomingSession = await db.playSession.findFirst({
    where: {
      clubId,
      deletedAt: null,
      date: { gte: todayStart },
    },
    orderBy: { date: "asc" },
    select: {
      id: true,
      date: true,
      courtType: true,
      note: true,
      address: true,
      googleAddressUrl: true,
      scheduleId: true,
      schedule: {
        select: {
          startTime: true,
          endTime: true,
          address: true,
          googleAddressUrl: true,
        },
      },
      _count: { select: { shares: true } },
    },
  });

  if (upcomingSession) {
    return {
      kind: "session",
      sessionId: upcomingSession.id,
      date: upcomingSession.date.toISOString(),
      courtType: upcomingSession.courtType,
      startTime: upcomingSession.schedule?.startTime ?? null,
      endTime: upcomingSession.schedule?.endTime ?? null,
      isScheduled: Boolean(upcomingSession.scheduleId),
      note: upcomingSession.note,
      address:
        upcomingSession.address ?? upcomingSession.schedule?.address ?? null,
      googleAddressUrl:
        upcomingSession.googleAddressUrl ??
        upcomingSession.schedule?.googleAddressUrl ??
        null,
      attendeeCount: upcomingSession._count.shares,
    };
  }

  const [schedules, fulfilledSessions] = await Promise.all([
    db.sessionSchedule.findMany({
      where: { clubId, enabled: true },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        weekdays: true,
        courtType: true,
        address: true,
        googleAddressUrl: true,
        enabled: true,
      },
    }),
    db.playSession.findMany({
      where: {
        clubId,
        scheduleId: { not: null },
        deletedAt: null,
      },
      select: { scheduleId: true, date: true },
    }),
  ]);

  const fulfilled = fulfilledSessions
    .filter((session) => session.scheduleId)
    .map((session) => ({
      scheduleId: session.scheduleId!,
      date: session.date,
    }));

  const [nextOccurrence] = getUpcomingOccurrences(schedules, fulfilled, {
    limit: 1,
  });
  if (!nextOccurrence) return null;

  return {
    kind: "schedule",
    scheduleId: nextOccurrence.scheduleId,
    date: nextOccurrence.date.toISOString(),
    startTime: nextOccurrence.startTime,
    endTime: nextOccurrence.endTime,
    courtType: nextOccurrence.courtType,
    address: nextOccurrence.address,
    googleAddressUrl: nextOccurrence.googleAddressUrl,
  };
}

export async function getDashboardData(clubId: string) {
  const [
    transactions,
    settings,
    sessionCount,
    upcomingItem,
    memberLedger,
  ] = await Promise.all([
    db.transaction.findMany({
      where: { clubId, deletedAt: null },
      select: { type: true, amount: true, category: true, memberId: true },
    }),
    db.clubSettings.findUnique({ where: { clubId } }),
    db.playSession.count({ where: { clubId, deletedAt: null } }),
    getUpcomingDashboardItem(clubId),
    loadClubMemberLedger(clubId),
  ]);

  const fundSummary = calcFundSummary(transactions);
  const expenseBreakdown = calcExpenseBreakdown(transactions);

  return {
    fundSummary,
    expenseBreakdown,
    memberLedger,
    sessionCount,
    settings,
    upcomingItem,
  };
}

export async function getMembers(clubId: string) {
  return db.member.findMany({ where: { clubId }, orderBy: { name: "asc" } });
}

export async function getShuttleTypes(clubId: string) {
  return db.shuttleType.findMany({
    where: { clubId },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getClubSettings(clubId: string) {
  return db.clubSettings.findUnique({ where: { clubId } });
}
