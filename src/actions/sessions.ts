"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireClubAdmin, requireClubViewAccess } from "@/lib/club-context";
import {
  calcSessionAllocations,
  calcSharedSessionBase,
  parseGuestAllocations,
  parseShareAllocations,
  sumSessionShareTotals,
} from "@/lib/domain/sessions";
import type { Prisma } from "@prisma/client";
import { parseCourtType } from "@/lib/format";
import { formatScheduleTimeRange } from "@/lib/domain/schedule";
import { parseAddressFields } from "@/lib/domain/address";
import {
  SESSION_LIST_PAGE_SIZE,
  sessionListDayBounds,
  type SessionListFilters,
} from "@/lib/sessions-list-filters";

function clubPaths(clubId: string) {
  return [
    `/g/${clubId}/sessions`,
    `/g/${clubId}/sessions/list`,
    `/g/${clubId}/sessions/schedule`,
    `/g/${clubId}/sessions/new`,
    `/g/${clubId}`,
    `/g/${clubId}/members`,
  ];
}

async function parseSessionFormData(clubId: string, formData: FormData) {
  const date = new Date(String(formData.get("date")));
  const courtRental = Number(formData.get("courtRental") ?? 0);
  const shuttlesUsed = Number(formData.get("shuttlesUsed") ?? 0);
  const shuttleTypeId = String(formData.get("shuttleTypeId") ?? "");
  const courtTypeRaw = String(formData.get("courtType") ?? "");
  const courtType = parseCourtType(courtTypeRaw);
  const noteRaw = String(formData.get("note") ?? "").trim();
  const note = noteRaw || null;
  const { address, googleAddressUrl } = parseAddressFields(formData);
  const memberInputs = parseShareAllocations(
    String(formData.get("shareAllocations") ?? "[]"),
  );
  const guestInputs = parseGuestAllocations(
    String(formData.get("guestAllocations") ?? "[]"),
  );

  const memberIds = new Set(memberInputs.map((member) => member.memberId));
  for (const guest of guestInputs) {
    if (guest.hostedByMemberId && !memberIds.has(guest.hostedByMemberId)) {
      throw new Error("Khách đi cùng phải thuộc thành viên đã chọn");
    }
  }

  if (!date.getTime()) throw new Error("Ngày không hợp lệ");
  if (!courtType) throw new Error("Vui lòng chọn loại sân");

  const shuttleType = shuttleTypeId
    ? await db.shuttleType.findFirst({ where: { id: shuttleTypeId, clubId } })
    : await db.shuttleType.findFirst({
        where: { clubId },
        orderBy: { sortOrder: "asc" },
      });
  if (!shuttleType) {
    throw new Error("Chưa cấu hình loại cầu. Vào Cài đặt để thêm loại cầu.");
  }

  const sharedBase = calcSharedSessionBase({
    courtRental,
    shuttlesUsed,
    shuttlePricing: {
      pricePerBlock: shuttleType.pricePerBlock,
      shuttlesPerBlock: shuttleType.shuttlesPerBlock,
    },
  });
  const { shares, guests } = calcSessionAllocations(
    sharedBase,
    memberInputs,
    guestInputs,
  );
  const { totalCost, water, parking, costPerPerson } = sumSessionShareTotals(
    shares,
    guests,
  );

  return {
    date,
    courtType,
    note,
    address,
    googleAddressUrl,
    shuttleType,
    shuttlesUsed,
    courtRental,
    water,
    parking,
    totalCost,
    costPerPerson,
    shares,
    guests,
  };
}

export async function createSessionAction(clubId: string, formData: FormData) {
  await requireClubAdmin(clubId);

  const scheduleIdRaw = String(formData.get("scheduleId") ?? "").trim();
  const scheduleId = scheduleIdRaw || null;
  let parsed = await parseSessionFormData(clubId, formData);
  const { date } = parsed;
  let { courtType, note, address, googleAddressUrl } = parsed;

  if (scheduleId) {
    const schedule = await db.sessionSchedule.findFirst({
      where: { id: scheduleId, clubId },
    });
    if (!schedule) throw new Error("Lịch đánh không hợp lệ");
    if (!schedule.enabled) throw new Error("Lịch đánh đã tắt");
    if (!schedule.weekdays.includes(date.getDay())) {
      throw new Error("Ngày không khớp với lịch đánh đã chọn");
    }

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const existing = await db.playSession.findFirst({
      where: {
        clubId,
        scheduleId,
        deletedAt: null,
        date: { gte: dayStart, lte: dayEnd },
      },
    });
    if (existing) throw new Error("Buổi đánh này đã được ghi nhận");

    courtType = schedule.courtType;
    note =
      note ??
      `Buổi ${formatScheduleTimeRange(schedule.startTime, schedule.endTime)}`;
    address = address ?? schedule.address;
    googleAddressUrl = googleAddressUrl ?? schedule.googleAddressUrl;
    parsed = { ...parsed, courtType, note, address, googleAddressUrl };
  }

  await db.playSession.create({
    data: {
      clubId,
      date: parsed.date,
      courtType: parsed.courtType,
      scheduleId,
      shuttleTypeId: parsed.shuttleType.id,
      shuttlesUsed: parsed.shuttlesUsed,
      courtRental: parsed.courtRental,
      water: parsed.water,
      parking: parsed.parking,
      totalCost: parsed.totalCost,
      costPerPerson: parsed.costPerPerson,
      address: parsed.address,
      googleAddressUrl: parsed.googleAddressUrl,
      note: parsed.note,
      shares: {
        create: parsed.shares.map((share) => ({
          memberId: share.memberId,
          amount: share.amount,
          water: share.water,
          parking: share.parking,
          extra: share.extra,
          extraNote: share.extraNote,
          memberPaysForGuests: share.memberPaysForGuests,
        })),
      },
      guests: {
        create: parsed.guests.map((guest) => ({
          name: guest.name,
          amount: guest.amount,
          water: guest.water,
          parking: guest.parking,
          extra: guest.extra,
          extraNote: guest.extraNote,
          hostedByMemberId: guest.hostedByMemberId,
        })),
      },
    },
  });

  clubPaths(clubId).forEach((p) => revalidatePath(p));
}

export async function updateSessionAction(
  clubId: string,
  sessionId: string,
  formData: FormData,
) {
  await requireClubAdmin(clubId);

  const existing = await db.playSession.findFirst({
    where: { id: sessionId, clubId, deletedAt: null },
  });
  if (!existing) throw new Error("Không tìm thấy buổi đánh");

  let parsed = await parseSessionFormData(clubId, formData);
  const { date, note } = parsed;
  let { courtType } = parsed;

  if (existing.scheduleId) {
    const schedule = await db.sessionSchedule.findFirst({
      where: { id: existing.scheduleId, clubId },
    });
    if (!schedule) throw new Error("Lịch đánh không hợp lệ");
    if (!schedule.weekdays.includes(date.getDay())) {
      throw new Error("Ngày không khớp với lịch đánh đã chọn");
    }

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const duplicate = await db.playSession.findFirst({
      where: {
        clubId,
        scheduleId: existing.scheduleId,
        deletedAt: null,
        id: { not: sessionId },
        date: { gte: dayStart, lte: dayEnd },
      },
    });
    if (duplicate) throw new Error("Buổi đánh này đã được ghi nhận");

    courtType = schedule.courtType;
    parsed = { ...parsed, courtType, note: note ?? existing.note };
  }

  await db.$transaction([
    db.sessionGuest.deleteMany({ where: { sessionId } }),
    db.sessionShare.deleteMany({ where: { sessionId } }),
    db.playSession.update({
      where: { id: sessionId },
      data: {
        date: parsed.date,
        courtType: parsed.courtType,
        shuttleTypeId: parsed.shuttleType.id,
        shuttlesUsed: parsed.shuttlesUsed,
        courtRental: parsed.courtRental,
        water: parsed.water,
        parking: parsed.parking,
        totalCost: parsed.totalCost,
        costPerPerson: parsed.costPerPerson,
        address: parsed.address,
        googleAddressUrl: parsed.googleAddressUrl,
        note: parsed.note,
        shares: {
          create: parsed.shares.map((share) => ({
            memberId: share.memberId,
            amount: share.amount,
            water: share.water,
            parking: share.parking,
            extra: share.extra,
            extraNote: share.extraNote,
            memberPaysForGuests: share.memberPaysForGuests,
          })),
        },
        guests: {
          create: parsed.guests.map((guest) => ({
            name: guest.name,
            amount: guest.amount,
            water: guest.water,
            parking: guest.parking,
            extra: guest.extra,
            extraNote: guest.extraNote,
            hostedByMemberId: guest.hostedByMemberId,
          })),
        },
      },
    }),
  ]);

  clubPaths(clubId).forEach((p) => revalidatePath(p));
  revalidatePath(`/g/${clubId}/sessions/${sessionId}`);
}

export async function deleteSessionAction(clubId: string, id: string) {
  await requireClubAdmin(clubId);
  const session = await db.playSession.findFirst({
    where: { id, clubId },
  });
  if (!session) throw new Error("Không tìm thấy buổi đánh");

  await db.playSession.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  clubPaths(clubId).forEach((p) => revalidatePath(p));
  revalidatePath(`/g/${clubId}/sessions/${id}`);
}

const sessionListInclude = {
  shares: { include: { member: true } },
  guests: { include: { hostedBy: { select: { id: true, name: true } } } },
  shuttleType: { select: { id: true, name: true } },
} as const;

function buildSessionListWhere(
  clubId: string,
  filters: Omit<SessionListFilters, "page">,
  restrictToMemberId?: string,
): Prisma.PlaySessionWhereInput {
  const where: Prisma.PlaySessionWhereInput = {
    clubId,
    deletedAt: null,
  };

  if (restrictToMemberId) {
    where.shares = {
      some: { memberId: restrictToMemberId, amount: { gt: 0 } },
    };
  } else if (filters.memberIds.length > 0) {
    where.shares = {
      some: {
        memberId: { in: filters.memberIds },
        amount: { gt: 0 },
      },
    };
  }

  if (filters.courtType) {
    where.courtType = filters.courtType;
  }

  if (filters.note) {
    where.note = { contains: filters.note, mode: "insensitive" };
  }

  if (filters.date) {
    const { dayStart, dayEnd } = sessionListDayBounds(filters.date);
    where.date = { gte: dayStart, lte: dayEnd };
  }

  return where;
}

export async function getSessionsPaginated(
  clubId: string,
  filters: SessionListFilters,
  restrictToMemberId?: string,
) {
  await requireClubViewAccess(clubId);

  const pageSize = SESSION_LIST_PAGE_SIZE;
  const where = buildSessionListWhere(clubId, filters, restrictToMemberId);
  const total = await db.playSession.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(filters.page, totalPages);

  const sessions = await db.playSession.findMany({
    where,
    include: sessionListInclude,
    orderBy: { date: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return {
    sessions,
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function getSessions(clubId: string, memberId?: string) {
  await requireClubViewAccess(clubId);
  return db.playSession.findMany({
    where: buildSessionListWhere(
      clubId,
      { courtType: null, memberIds: [], date: null, note: null },
      memberId,
    ),
    include: sessionListInclude,
    orderBy: { date: "desc" },
  });
}

const sessionDetailInclude = {
  ...sessionListInclude,
  schedule: {
    select: { id: true, startTime: true, endTime: true },
  },
} as const;

export async function getSessionDetail(
  clubId: string,
  sessionId: string,
  restrictToMemberId?: string,
) {
  await requireClubViewAccess(clubId);

  return db.playSession.findFirst({
    where: {
      id: sessionId,
      clubId,
      deletedAt: null,
      ...(restrictToMemberId
        ? {
            shares: {
              some: { memberId: restrictToMemberId, amount: { gt: 0 } },
            },
          }
        : {}),
    },
    include: sessionDetailInclude,
  });
}
