"use client";

import Link from "next/link";
import { Trophy } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatVND } from "@/lib/format";
import { cn } from "@/lib/utils";

export type MemberLedgerRow = {
  memberId: string;
  memberName: string;
  totalPaid: number;
  totalPlayCost: number;
  remainingBalance: number;
};

function sortByTotalPaid(rows: MemberLedgerRow[]) {
  return [...rows].sort(
    (a, b) =>
      b.totalPaid - a.totalPaid ||
      a.memberName.localeCompare(b.memberName, "vi"),
  );
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getPodiumSlots(topThree: MemberLedgerRow[]) {
  if (topThree.length === 0) return [];
  if (topThree.length === 1) {
    return [{ row: topThree[0], rank: 1 as const }];
  }
  if (topThree.length === 2) {
    return [
      { row: topThree[1], rank: 2 as const },
      { row: topThree[0], rank: 1 as const },
    ];
  }
  return [
    { row: topThree[1], rank: 2 as const },
    { row: topThree[0], rank: 1 as const },
    { row: topThree[2], rank: 3 as const },
  ];
}

const PEDESTAL_HEIGHT: Record<1 | 2 | 3, string> = {
  1: "h-28 sm:h-32",
  2: "h-20 sm:h-24",
  3: "h-16 sm:h-20",
};

function MemberAvatar({ name, rank }: { name: string; rank: 1 | 2 | 3 }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-white font-semibold text-[var(--ink)] ring-2 ring-[var(--ink)]/15",
        rank === 1
          ? "h-14 w-14 text-base sm:h-16 sm:w-16"
          : "h-12 w-12 text-sm",
      )}
    >
      {getInitials(name) || "?"}
    </div>
  );
}

function LeaderboardPodium({
  clubId,
  rows,
}: {
  clubId: string;
  rows: MemberLedgerRow[];
}) {
  const topThree = rows.slice(0, 3);
  const slots = getPodiumSlots(topThree);

  if (slots.length === 0) return null;

  return (
    <div className="mb-6 overflow-hidden rounded-xl bg-[var(--primary)] px-3 py-5 sm:px-6">
      <div className="flex items-end justify-center gap-2 sm:gap-4">
        {slots.map(({ row, rank }) => (
          <div
            key={row.memberId}
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center",
              rank === 1
                ? "max-w-[8.5rem] sm:max-w-[10rem]"
                : "max-w-[7rem] sm:max-w-[8.5rem]",
            )}
          >
            <div className="relative mb-3 flex flex-col items-center">
              <div
                className="absolute -inset-x-3 bottom-0 top-6 bg-white/20"
                style={{
                  clipPath:
                    rank === 1
                      ? "polygon(15% 0, 85% 0, 100% 100%, 0 100%)"
                      : rank === 2
                        ? "polygon(20% 0, 100% 0, 100% 100%, 0 100%)"
                        : "polygon(0 0, 80% 0, 100% 100%, 0 100%)",
                }}
              />
              <div className="relative z-10 flex flex-col items-center">
                <MemberAvatar name={row.memberName} rank={rank} />
                <p className="mt-2 max-w-full truncate text-center text-sm font-bold text-[var(--ink)]">
                  <Link
                    href={`/g/${clubId}/members/${row.memberId}`}
                    className="hover:underline"
                  >
                    {row.memberName}
                  </Link>
                </p>
                <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-[var(--ink)] shadow-sm">
                  <Trophy className="h-3 w-3 text-[var(--primary)]" />
                  <span className="font-number font-bold">
                    {formatVND(row.totalPaid)}
                  </span>
                </div>
              </div>
            </div>
            <div
              className={cn(
                "flex w-full items-center justify-center rounded-t-md bg-white/90 font-number text-3xl font-bold text-[var(--primary-active)] shadow-[inset_0_-4px_0_rgba(0,0,0,0.08)] sm:text-4xl",
                PEDESTAL_HEIGHT[rank],
              )}
            >
              {rank}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LeaderboardRowBalance({
  balance,
  className,
}: {
  balance: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      <span
        className={cn(
          "font-number font-medium",
          balance < 0
            ? "text-trading-down"
            : balance > 0
              ? "text-trading-up"
              : "",
        )}
      >
        {formatVND(balance)}
      </span>
      {balance < 0 && (
        <Badge variant="destructive" className="shrink-0">
          Phải đóng thêm
        </Badge>
      )}
    </div>
  );
}

function LeaderboardMobileList({
  clubId,
  rows,
}: {
  clubId: string;
  rows: MemberLedgerRow[];
}) {
  return (
    <ul className="space-y-2 sm:hidden">
      {rows.map((row, index) => (
        <li
          key={row.memberId}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3"
        >
          <div className="flex items-start gap-3">
            <span className="font-number w-6 shrink-0 text-sm font-medium text-[var(--color-muted-foreground)]">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1 space-y-2">
              <Link
                href={`/g/${clubId}/members/${row.memberId}`}
                className="block truncate font-medium text-[var(--primary)] hover:text-[var(--primary-active)] hover:underline"
              >
                {row.memberName}
              </Link>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                <div>
                  <dt className="text-[var(--color-muted-foreground)]">
                    Đã đóng
                  </dt>
                  <dd className="font-number mt-0.5 font-medium">
                    {formatVND(row.totalPaid)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--color-muted-foreground)]">
                    Chi phí
                  </dt>
                  <dd className="font-number mt-0.5 font-medium">
                    {formatVND(row.totalPlayCost)}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-[var(--color-muted-foreground)]">
                    Còn lại
                  </dt>
                  <dd className="mt-0.5">
                    <LeaderboardRowBalance balance={row.remainingBalance} />
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function LeaderboardDesktopTable({
  clubId,
  rows,
}: {
  clubId: string;
  rows: MemberLedgerRow[];
}) {
  return (
    <div className="hidden sm:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Lông thủ</TableHead>
            <TableHead className="text-right">Đã đóng</TableHead>
            <TableHead className="text-right">Chi phí</TableHead>
            <TableHead className="text-right">Còn lại</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={row.memberId}>
              <TableCell className="font-number text-[var(--color-muted-foreground)]">
                {index + 1}
              </TableCell>
              <TableCell>
                <Link
                  href={`/g/${clubId}/members/${row.memberId}`}
                  className="font-medium text-[var(--primary)] hover:text-[var(--primary-active)] hover:underline"
                >
                  {row.memberName}
                </Link>
              </TableCell>
              <TableCell className="font-number text-right">
                {formatVND(row.totalPaid)}
              </TableCell>
              <TableCell className="font-number text-right">
                {formatVND(row.totalPlayCost)}
              </TableCell>
              <TableCell className="text-right">
                <LeaderboardRowBalance
                  balance={row.remainingBalance}
                  className="justify-end"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function MemberLeaderboard({
  clubId,
  rows,
}: {
  clubId: string;
  rows: MemberLedgerRow[];
}) {
  const sortedRows = sortByTotalPaid(rows);

  if (sortedRows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-[var(--color-muted-foreground)]">
        Chưa có dữ liệu
      </p>
    );
  }

  return (
    <>
      {sortedRows.length >= 2 && (
        <LeaderboardPodium clubId={clubId} rows={sortedRows} />
      )}

      <LeaderboardMobileList clubId={clubId} rows={sortedRows} />
      <LeaderboardDesktopTable clubId={clubId} rows={sortedRows} />
    </>
  );
}
