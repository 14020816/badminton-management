import { addDays, format, isSameDay } from "date-fns";
import { vi } from "date-fns/locale";
import type { CourtType } from "@prisma/client";
import { formatCourtType } from "@/lib/format";

export type SessionScheduleRow = {
  id: string;
  startTime: string;
  endTime: string;
  weekdays: number[];
  courtType: CourtType;
  address: string | null;
  googleAddressUrl: string | null;
  enabled: boolean;
};

export type UpcomingSessionOccurrence = {
  scheduleId: string;
  date: Date;
  startTime: string;
  endTime: string;
  courtType: CourtType;
  address: string | null;
  googleAddressUrl: string | null;
};

export const WEEKDAY_OPTIONS = [
  { value: 1, label: "T2" },
  { value: 2, label: "T3" },
  { value: 3, label: "T4" },
  { value: 4, label: "T5" },
  { value: 5, label: "T6" },
  { value: 6, label: "T7" },
  { value: 0, label: "CN" },
] as const;

export function formatWeekdays(weekdays: number[]): string {
  const sorted = [...weekdays].sort((a, b) => {
    const order = (day: number) => (day === 0 ? 7 : day);
    return order(a) - order(b);
  });
  return sorted
    .map((day) => WEEKDAY_OPTIONS.find((option) => option.value === day)?.label ?? String(day))
    .join(", ");
}

export function formatScheduleTime(time: string): string {
  const [hours, minutes] = time.split(":");
  if (!hours || minutes === undefined) return time;
  return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
}

export function formatScheduleTimeRange(startTime: string, endTime: string): string {
  return `${formatScheduleTime(startTime)} – ${formatScheduleTime(endTime)}`;
}

export function formatScheduleLabel(schedule: {
  weekdays: number[];
  startTime: string;
  endTime: string;
  courtType: CourtType;
}): string {
  return `${formatWeekdays(schedule.weekdays)} · ${formatScheduleTimeRange(schedule.startTime, schedule.endTime)} · ${formatCourtType(schedule.courtType)}`;
}

export function isDateMatchingSchedule(date: Date, weekdays: number[]): boolean {
  return weekdays.includes(date.getDay());
}

export function formatUpcomingDate(date: Date): string {
  return format(date, "EEE dd/MM/yyyy", { locale: vi });
}

export function toDateInputValue(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function parseScheduleTime(value: string): string | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function isValidScheduleTimeRange(startTime: string, endTime: string): boolean {
  return timeToMinutes(endTime) > timeToMinutes(startTime);
}

export function getUpcomingOccurrences(
  schedules: SessionScheduleRow[],
  fulfilled: { scheduleId: string; date: Date }[],
  options: { from?: Date; limit?: number; maxDays?: number } = {},
): UpcomingSessionOccurrence[] {
  const from = options.from ?? new Date();
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);

  const limit = options.limit ?? 14;
  const maxDays = options.maxDays ?? 84;
  const results: UpcomingSessionOccurrence[] = [];

  for (let dayOffset = 0; dayOffset < maxDays && results.length < limit; dayOffset++) {
    const date = addDays(start, dayOffset);
    const weekday = date.getDay();

    for (const schedule of schedules) {
      if (!schedule.enabled) continue;
      if (!schedule.weekdays.includes(weekday)) continue;
      if (isOccurrenceFulfilled(schedule.id, date, fulfilled)) continue;

      results.push({
        scheduleId: schedule.id,
        date,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        courtType: schedule.courtType,
        address: schedule.address,
        googleAddressUrl: schedule.googleAddressUrl,
      });
    }
  }

  return results
    .sort((a, b) => {
      const dateDiff = a.date.getTime() - b.date.getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.startTime.localeCompare(b.startTime);
    })
    .slice(0, limit);
}

function isOccurrenceFulfilled(
  scheduleId: string,
  date: Date,
  fulfilled: { scheduleId: string; date: Date }[],
): boolean {
  return fulfilled.some(
    (entry) => entry.scheduleId === scheduleId && isSameDay(entry.date, date),
  );
}

export type ScheduleDateOption = {
  value: string;
  label: string;
  isPast: boolean;
};

export function getScheduleDateOptions(
  schedule: { id: string; weekdays: number[] },
  fulfilled: { scheduleId: string; date: Date | string }[],
  options: { pastMaxDays?: number; futureCount?: number; from?: Date } = {},
): ScheduleDateOption[] {
  const pastMaxDays = options.pastMaxDays ?? 28;
  const futureCount = options.futureCount ?? 5;
  const today = options.from ?? new Date();
  today.setHours(0, 0, 0, 0);

  const fulfilledForSchedule = fulfilled.filter(
    (entry) => entry.scheduleId === schedule.id,
  );
  const isFulfilled = (date: Date) =>
    fulfilledForSchedule.some((entry) => isSameDay(new Date(entry.date), date));

  const past: ScheduleDateOption[] = [];
  for (let offset = -1; offset >= -pastMaxDays; offset--) {
    const date = addDays(today, offset);
    if (!schedule.weekdays.includes(date.getDay())) continue;
    if (isFulfilled(date)) continue;
    past.push({
      value: toDateInputValue(date),
      label: formatUpcomingDate(date),
      isPast: true,
    });
  }
  past.reverse();

  const future: ScheduleDateOption[] = [];
  for (let offset = 0; future.length < futureCount; offset++) {
    const date = addDays(today, offset);
    if (!schedule.weekdays.includes(date.getDay())) continue;
    if (isFulfilled(date)) continue;
    future.push({
      value: toDateInputValue(date),
      label: formatUpcomingDate(date),
      isPast: false,
    });
  }

  return [...past, ...future];
}

export function isSelectableScheduleDate(
  date: Date,
  schedule: { id: string; weekdays: number[] },
  fulfilled: { scheduleId: string; date: Date | string }[],
): boolean {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  if (!schedule.weekdays.includes(normalized.getDay())) return false;

  return !fulfilled.some(
    (entry) =>
      entry.scheduleId === schedule.id &&
      isSameDay(new Date(entry.date), normalized),
  );
}
