"use server";

import { CourtType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireClubAdmin, requireClubViewAccess } from "@/lib/club-context";
import {
  getUpcomingOccurrences,
  isValidScheduleTimeRange,
  parseScheduleTime,
  type UpcomingSessionOccurrence,
} from "@/lib/domain/schedule";
import { parseCourtType } from "@/lib/format";
import { parseAddressFields } from "@/lib/domain/address";

function clubPaths(clubId: string) {
  return [
    `/g/${clubId}/settings`,
    `/g/${clubId}/settings/schedule`,
    `/g/${clubId}/sessions`,
    `/g/${clubId}/sessions/list`,
    `/g/${clubId}/sessions/schedule`,
  ];
}

export async function getSessionSchedules(clubId: string) {
  await requireClubViewAccess(clubId);
  return db.sessionSchedule.findMany({
    where: { clubId },
    orderBy: [{ enabled: "desc" }, { startTime: "asc" }, { createdAt: "asc" }],
  });
}

export async function getFulfilledScheduleSessions(clubId: string) {
  await requireClubViewAccess(clubId);
  const sessions = await db.playSession.findMany({
    where: {
      clubId,
      scheduleId: { not: null },
      deletedAt: null,
    },
    select: { scheduleId: true, date: true },
  });

  return sessions
    .filter((session) => session.scheduleId)
    .map((session) => ({
      scheduleId: session.scheduleId!,
      date: session.date.toISOString(),
    }));
}

export async function getUpcomingScheduledSessions(
  clubId: string,
): Promise<UpcomingSessionOccurrence[]> {
  await requireClubViewAccess(clubId);

  const [schedules, fulfilledSessions] = await Promise.all([
    getSessionSchedules(clubId),
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

  return getUpcomingOccurrences(schedules, fulfilled);
}

function parseSessionScheduleFormData(formData: FormData) {
  const startTime = parseScheduleTime(String(formData.get("startTime") ?? ""));
  const endTime = parseScheduleTime(String(formData.get("endTime") ?? ""));
  const weekdays = formData
    .getAll("weekdays")
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6);
  const courtType =
    parseCourtType(String(formData.get("courtType") ?? CourtType.FIXED)) ??
    CourtType.FIXED;
  const courtRental = Number(formData.get("courtRental") ?? 0);
  const { address, googleAddressUrl } = parseAddressFields(formData);

  if (!startTime || !endTime) throw new Error("Giờ không hợp lệ");
  if (!isValidScheduleTimeRange(startTime, endTime)) {
    throw new Error("Giờ kết thúc phải sau giờ bắt đầu");
  }
  if (weekdays.length === 0) throw new Error("Chọn ít nhất một ngày trong tuần");
  if (!Number.isFinite(courtRental) || courtRental < 0) {
    throw new Error("Thuê sân không hợp lệ");
  }

  return {
    startTime,
    endTime,
    weekdays,
    courtType,
    courtRental: Math.round(courtRental),
    address,
    googleAddressUrl,
  };
}

export async function createSessionScheduleAction(
  clubId: string,
  formData: FormData,
) {
  await requireClubAdmin(clubId);

  const data = parseSessionScheduleFormData(formData);

  await db.sessionSchedule.create({
    data: {
      clubId,
      ...data,
    },
  });

  clubPaths(clubId).forEach((path) => revalidatePath(path));
}

export async function updateSessionScheduleAction(
  clubId: string,
  scheduleId: string,
  formData: FormData,
) {
  await requireClubAdmin(clubId);

  const schedule = await db.sessionSchedule.findFirst({
    where: { id: scheduleId, clubId },
  });
  if (!schedule) throw new Error("Không tìm thấy lịch đánh");

  const data = parseSessionScheduleFormData(formData);

  await db.sessionSchedule.update({
    where: { id: scheduleId },
    data,
  });

  clubPaths(clubId).forEach((path) => revalidatePath(path));
}

export async function setSessionScheduleEnabledAction(
  clubId: string,
  id: string,
  enabled: boolean,
) {
  await requireClubAdmin(clubId);

  const schedule = await db.sessionSchedule.findFirst({
    where: { id, clubId },
  });
  if (!schedule) throw new Error("Không tìm thấy lịch đánh");

  await db.sessionSchedule.update({
    where: { id },
    data: { enabled },
  });

  clubPaths(clubId).forEach((path) => revalidatePath(path));
}
