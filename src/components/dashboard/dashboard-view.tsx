"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MobileDataCard,
  MobileDataField,
  MobileDataFields,
  MobileDataList,
  ResponsiveDataView,
} from "@/components/ui/mobile-data-list";
import { PageHeader } from "@/components/layout/page-header";
import { MemberLeaderboard } from "@/components/dashboard/member-leaderboard";
import { useDashboardMotion } from "@/components/dashboard/dashboard-motion";
import { AddressDisplay } from "@/components/form/address-fields";
import {
  formatScheduleTimeRange,
  formatUpcomingDate,
} from "@/lib/domain/schedule";
import type { DashboardUpcomingItem } from "@/lib/data/dashboard";
import { formatCourtType, formatVND } from "@/lib/format";

const CHART_COLORS = ["#fcd535", "#0ecb81", "#2dbdb6", "#3b82f6", "#707a8a"];

const MotionTableRow = motion(TableRow);

const STAT_CARDS = [
  { key: "expense", label: "Tổng chi" },
  { key: "income", label: "Tổng thu" },
  { key: "balance", label: "Số dư quỹ", highlight: true },
  { key: "sessions", label: "Buổi đánh" },
] as const;

export function DashboardView({
  clubId,
  fundSummary,
  expenseBreakdown,
  memberLedger,
  sessionCount,
  upcomingItem,
  isAdmin,
  currentMemberId,
  showFullLedger,
}: {
  clubId: string;
  fundSummary: {
    totalExpense: number;
    totalIncome: number;
    fundBalance: number;
  };
  expenseBreakdown: { category: string; label: string; total: number }[];
  memberLedger: {
    memberId: string;
    memberName: string;
    totalPaid: number;
    totalPlayCost: number;
    remainingBalance: number;
  }[];
  sessionCount: number;
  upcomingItem: DashboardUpcomingItem | null;
  isAdmin: boolean;
  currentMemberId?: string | null;
  showFullLedger?: boolean;
}) {
  const [showAll, setShowAll] = useState(showFullLedger ?? isAdmin);
  const motionConfig = useDashboardMotion();
  const rows = showAll
    ? memberLedger
    : memberLedger.filter((row) => row.memberId === currentMemberId);

  const statValues = {
    expense: formatVND(fundSummary.totalExpense),
    income: formatVND(fundSummary.totalIncome),
    balance: formatVND(fundSummary.fundBalance),
    sessions: String(sessionCount),
  };

  return (
    <motion.div className="space-y-6" {...motionConfig.page}>
      <motion.div {...motionConfig.section}>
        <PageHeader
          title="Tổng quan"
          description="Theo dõi quỹ chung và sổ cái lông thủ"
        />
      </motion.div>

      <motion.div
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4"
        {...motionConfig.statsContainer}
      >
        {STAT_CARDS.map((stat) => (
          <motion.div key={stat.key} {...motionConfig.statsItem}>
            <Card
              className={
                "highlight" in stat && stat.highlight
                  ? "border-[var(--hairline-on-dark)] bg-transparent"
                  : undefined
              }
            >
              <CardHeader>
                <CardTitle className="text-sm font-medium text-[var(--color-muted-foreground)]">
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p
                  className={`font-number text-2xl font-bold leading-tight sm:text-[2.5rem] ${
                    "highlight" in stat && stat.highlight
                      ? "text-[var(--primary)]"
                      : ""
                  }`}
                >
                  {statValues[stat.key]}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.div {...motionConfig.section}>
        <UpcomingSessionCard
          clubId={clubId}
          item={upcomingItem}
          isAdmin={isAdmin}
          upcomingContent={motionConfig.upcomingContent}
        />
      </motion.div>

      <motion.div
        className="grid gap-6 lg:grid-cols-2"
        {...motionConfig.gridContainer}
      >
        <motion.div {...motionConfig.gridItem}>
          <Card>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Bảng xếp hạng</CardTitle>
              {isAdmin && (
                <button
                  type="button"
                  className="self-start text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-active)] sm:self-auto"
                  onClick={() => setShowAll((v) => !v)}
                >
                  {showAll ? "Chỉ xem của tôi" : "Xem tất cả"}
                </button>
              )}
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                <motion.div
                  key={showAll ? "all" : "mine"}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  <MemberLeaderboard clubId={clubId} rows={rows} />
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...motionConfig.gridItem}>
          <Card>
            <CardHeader>
              <CardTitle>Phân loại chi phí</CardTitle>
            </CardHeader>
            <CardContent>
              <motion.div className="h-48 sm:h-64" {...motionConfig.chart}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseBreakdown}
                      dataKey="total"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      outerRadius="80%"
                      label={({ label }) => label}
                      animationBegin={0}
                      animationDuration={800}
                    >
                      {expenseBreakdown.map((_, index) => (
                        <Cell
                          key={index}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatVND(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>
              <ResponsiveDataView
                mobile={
                  <MobileDataList>
                    {expenseBreakdown.map((item) => (
                      <MobileDataCard key={item.category} title={item.label}>
                        <MobileDataFields columns={1}>
                          <MobileDataField
                            label="Tổng"
                            valueClassName="font-number font-medium"
                          >
                            {formatVND(item.total)}
                          </MobileDataField>
                        </MobileDataFields>
                      </MobileDataCard>
                    ))}
                  </MobileDataList>
                }
                desktop={
                  <Table minWidth="100%">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Loại</TableHead>
                        <TableHead className="text-right">Tổng</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenseBreakdown.map((item, index) => (
                        <MotionTableRow
                          key={item.category}
                          {...motionConfig.listItem(index)}
                        >
                          <TableCell>{item.label}</TableCell>
                          <TableCell className="font-number text-right">
                            {formatVND(item.total)}
                          </TableCell>
                        </MotionTableRow>
                      ))}
                    </TableBody>
                  </Table>
                }
              />
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function UpcomingSessionCard({
  clubId,
  item,
  isAdmin,
  upcomingContent,
}: {
  clubId: string;
  item: DashboardUpcomingItem | null;
  isAdmin: boolean;
  upcomingContent: {
    initial: { opacity: number; y: number };
    animate: {
      opacity: number;
      y: number;
      transition: { duration: number; ease: readonly [number, number, number, number] };
    };
    exit: {
      opacity: number;
      y: number;
      transition: { duration: number };
    };
  };
}) {
  const actionHref =
    item?.kind === "schedule" && isAdmin
      ? `/g/${clubId}/sessions/schedule`
      : `/g/${clubId}/sessions/list`;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Buổi đánh sắp tới</CardTitle>
        {item && isAdmin && (
          <Link
            href={actionHref}
            className="self-start text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-active)] sm:self-auto"
          >
            {item.kind === "schedule" ? "Ghi nhận buổi đánh" : "Xem buổi đánh"}
          </Link>
        )}
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {!item ? (
            <motion.p
              key="empty"
              className="text-sm text-[var(--color-muted-foreground)]"
              {...upcomingContent}
            >
              Chưa có buổi đánh sắp tới
            </motion.p>
          ) : (
            <motion.div
              key={`${item.kind}-${item.date}`}
              className="space-y-3"
              {...upcomingContent}
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-number text-2xl font-bold leading-tight text-[var(--primary)] sm:text-[2rem]">
                  {formatUpcomingDate(new Date(item.date))}
                </p>
                <Badge variant="outline">
                  {item.kind === "session"
                    ? item.isScheduled
                      ? "Lịch cố định"
                      : "Thủ công"
                    : "Lịch cố định"}
                </Badge>
                {item.kind === "schedule" && (
                  <Badge variant="secondary">Chưa ghi nhận</Badge>
                )}
              </div>

              <div className="grid gap-2 text-sm sm:grid-cols-2">
                {(item.kind === "schedule" || item.startTime) && (
                  <p>
                    <span className="text-[var(--color-muted-foreground)]">
                      Giờ:{" "}
                    </span>
                    {formatScheduleTimeRange(
                      item.startTime ?? "",
                      item.endTime ?? "",
                    )}
                  </p>
                )}
                <p>
                  <span className="text-[var(--color-muted-foreground)]">
                    Loại sân:{" "}
                  </span>
                  {formatCourtType(item.courtType)}
                </p>
                <AddressDisplay
                  address={item.address}
                  googleAddressUrl={item.googleAddressUrl}
                />
                {item.kind === "session" && item.attendeeCount > 0 && (
                  <p>
                    <span className="text-[var(--color-muted-foreground)]">
                      Tham gia:{" "}
                    </span>
                    {item.attendeeCount} lông thủ
                  </p>
                )}
                {item.kind === "session" && item.note && (
                  <p className="sm:col-span-2">
                    <span className="text-[var(--color-muted-foreground)]">
                      Ghi chú:{" "}
                    </span>
                    {item.note}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
