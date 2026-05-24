import type { LucideIcon } from "lucide-react";
import {
  Home,
  CalendarDays,
  ArrowLeftRight,
  Trophy,
  PartyPopper,
  Settings,
  LayoutGrid,
} from "lucide-react";
import { ClubRole } from "@prisma/client";

export type NavSubItem = {
  href: string;
  label: string;
  adminOnly?: boolean;
};

export function clubSessionsNavItems(clubId: string): NavSubItem[] {
  const base = `/g/${clubId}/sessions`;
  return [
    { href: `${base}/list`, label: "Danh sách" },
    { href: `${base}/schedule`, label: "Thêm cố định", adminOnly: true },
    { href: `${base}/new`, label: "Thêm thủ công", adminOnly: true },
  ];
}

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  /** When set, any path under this prefix marks the section active (e.g. session detail). */
  matchPrefix?: string;
  children?: NavSubItem[];
};

export function clubSettingsNavItems(clubId: string): NavSubItem[] {
  const base = `/g/${clubId}/settings`;
  return [
    { href: `${base}/info`, label: "Thông tin" },
    { href: `${base}/shuttles`, label: "Cầu lông" },
    { href: `${base}/schedule`, label: "Lịch đánh" },
    { href: `${base}/members`, label: "Thành viên" },
  ];
}

export function clubNavItems(clubId: string): NavItem[] {
  const base = `/g/${clubId}`;
  const settingsBase = `${base}/settings`;
  return [
    { href: base, label: "Tổng quan", icon: Home },
    {
      href: `${base}/sessions/list`,
      label: "Buổi đánh",
      icon: CalendarDays,
      matchPrefix: `${base}/sessions`,
      children: clubSessionsNavItems(clubId),
    },
    { href: `${base}/transactions`, label: "Giao dịch", icon: ArrowLeftRight },
    { href: `${base}/tournaments`, label: "Giải đấu", icon: Trophy },
    { href: `${base}/parties`, label: "Liên hoan", icon: PartyPopper },
    {
      href: `${settingsBase}/info`,
      label: "Cài đặt",
      icon: Settings,
      adminOnly: true,
      matchPrefix: settingsBase,
      children: clubSettingsNavItems(clubId),
    },
  ];
}

export const homeNavItem: NavItem = {
  href: "/",
  label: "Tất cả nhóm",
  icon: LayoutGrid,
};

export function filterNavItems(items: NavItem[], role: ClubRole) {
  return items.filter((item) => !item.adminOnly || role === ClubRole.ADMIN);
}
