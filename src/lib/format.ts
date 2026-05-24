import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type { CourtType } from "@prisma/client";

export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + " ₫";
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd/MM/yyyy", { locale: vi });
}

export function formatSessionDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "EEE - dd/MM/yyyy", { locale: vi });
}

export function formatDateInput(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseExcelSerialDate(serial: number): Date {
  const epoch = new Date(Date.UTC(1899, 11, 30));
  return new Date(epoch.getTime() + serial * 86400000);
}

export function excelSerialFromDate(date: Date): number {
  const epoch = new Date(Date.UTC(1899, 11, 30));
  return Math.round((date.getTime() - epoch.getTime()) / 86400000);
}

export const COURT_TYPE_LABELS: Record<CourtType, string> = {
  FIXED: "Cố định",
  FLEXIBLE: "Linh hoạt",
};

export const COURT_TYPES = Object.keys(COURT_TYPE_LABELS) as CourtType[];

export function parseCourtType(
  value: string | null | undefined,
): CourtType | null {
  if (!value) return null;
  if (value === "FIXED" || value === "FLEXIBLE") return value;
  const entry = Object.entries(COURT_TYPE_LABELS).find(
    ([, label]) => label === value.trim(),
  );
  return entry ? (entry[0] as CourtType) : null;
}

export function formatCourtType(value: CourtType | null | undefined): string {
  if (!value) return "—";
  return COURT_TYPE_LABELS[value];
}

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  COURT_RENTAL: "Thuê sân",
  SHUTTLE_PURCHASE: "Mua cầu",
  WATER: "Nước",
  PARKING: "Gửi xe",
  OPTION: "Option",
};

export const INCOME_CATEGORY_LABELS: Record<string, string> = {
  FUND_CONTRIBUTION: "Đóng quỹ",
  OPTIONAL: "Optional",
};

export const EXPENSE_LABEL_TO_CODE: Record<string, string> = {
  "Thuê sân": "COURT_RENTAL",
  "Mua cầu": "SHUTTLE_PURCHASE",
  Nước: "WATER",
  "Gửi xe": "PARKING",
  Option: "OPTION",
};

export const INCOME_LABEL_TO_CODE: Record<string, string> = {
  "Đóng quỹ": "FUND_CONTRIBUTION",
  Optional: "OPTIONAL",
};

export function resolveMemberName(name: string): string {
  if (name.trim() === "Sơn") return "Sơn Lê";
  return name.trim();
}

export function toInt(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : fallback;
}
