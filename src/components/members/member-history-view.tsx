"use client";

import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  MobileDataEmpty,
  MobileDataField,
  MobileDataFields,
  MobileDataList,
  ResponsiveDataView,
} from "@/components/ui/mobile-data-list";
import { PageHeader } from "@/components/layout/page-header";
import {
  INCOME_CATEGORY_LABELS,
  formatCourtType,
  formatDate,
  formatSessionDate,
  formatVND,
} from "@/lib/format";
import { buildSessionDetailPath } from "@/lib/sessions-list-filters";
import { cn } from "@/lib/utils";
import {
  buildMemberHistoryPath,
  type MemberHistoryData,
} from "@/lib/data/member-history";

export function MemberHistoryView({
  clubId,
  memberId,
  member,
  ledger,
  transactions,
  sessionShares,
  tournamentMembers,
  partyMembers,
  sessionsPagination,
  stats,
}: MemberHistoryData & { clubId: string; memberId: string }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          href={`/g/${clubId}`}
          className="text-sm text-[var(--color-muted-foreground)] hover:text-[var(--primary)]"
        >
          ← Quay lại tổng quan
        </Link>
        <PageHeader
          title={member.name}
          description="Lịch sử buổi đánh và giao dịch đóng quỹ"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-[var(--color-muted-foreground)]">
              Đã đóng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-number text-2xl font-bold leading-tight text-[var(--primary)]">
              {formatVND(ledger.totalPaid)}
            </p>
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
              {stats.contributionCount} lần đóng quỹ
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-[var(--color-muted-foreground)]">
              Chi phí
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-number text-2xl font-bold leading-tight">
              {formatVND(ledger.totalPlayCost)}
            </p>
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
              {stats.sessionCount} buổi đánh
              {stats.tournamentCost > 0 || stats.partyCost > 0
                ? ` · giải/liên hoan ${formatVND(stats.tournamentCost + stats.partyCost)}`
                : ""}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-[var(--color-muted-foreground)]">
              Còn lại
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={cn(
                "font-number text-2xl font-bold leading-tight",
                ledger.remainingBalance < 0
                  ? "text-trading-down"
                  : ledger.remainingBalance > 0
                    ? "text-trading-up"
                    : "",
              )}
            >
              {formatVND(ledger.remainingBalance)}
            </p>
            {ledger.remainingBalance < 0 && (
              <Badge variant="destructive" className="mt-2">
                Phải đóng thêm
              </Badge>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-[var(--color-muted-foreground)]">
              Buổi đánh
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-number text-2xl font-bold leading-tight">
              {stats.sessionCount}
            </p>
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
              Chi phí sân: {formatVND(stats.sessionCost)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sessions" className="min-w-0">
        <TabsList>
          <TabsTrigger value="sessions">
            Buổi đánh ({stats.sessionCount})
          </TabsTrigger>
          <TabsTrigger value="transactions">
            Giao dịch ({transactions.length})
          </TabsTrigger>
          {tournamentMembers.length > 0 && (
            <TabsTrigger value="tournaments">
              Giải ({tournamentMembers.length})
            </TabsTrigger>
          )}
          {partyMembers.length > 0 && (
            <TabsTrigger value="parties">
              Liên hoan ({partyMembers.length})
            </TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="sessions">
          <Card>
            <CardContent className="pt-6">
              <ResponsiveDataView
                mobile={
                  sessionShares.length === 0 ? (
                    <MobileDataEmpty>Chưa tham gia buổi đánh nào</MobileDataEmpty>
                  ) : (
                    <MobileDataList>
                      {sessionShares.map((share) => (
                        <MobileDataCard
                          key={share.id}
                          title={
                            <Link
                              href={buildSessionDetailPath(
                                clubId,
                                share.session.id,
                              )}
                              className="text-[var(--primary)] hover:text-[var(--primary-active)] hover:underline"
                            >
                              {formatSessionDate(share.session.date)}
                            </Link>
                          }
                        >
                          <MobileDataFields>
                            <MobileDataField label="Loại sân">
                              {formatCourtType(share.session.courtType)}
                            </MobileDataField>
                            <MobileDataField
                              label="Chi phí"
                              valueClassName="font-number text-right"
                            >
                              {formatVND(share.amount)}
                            </MobileDataField>
                            <MobileDataField label="Loại cầu">
                              {share.session.shuttleType?.name ?? "—"}
                            </MobileDataField>
                            <MobileDataField label="Ghi chú" fullWidth>
                              {share.session.note ?? "—"}
                            </MobileDataField>
                          </MobileDataFields>
                        </MobileDataCard>
                      ))}
                    </MobileDataList>
                  )
                }
                desktop={
                  <Table minWidth="36rem">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ngày</TableHead>
                        <TableHead>Loại sân</TableHead>
                        <TableHead>Loại cầu</TableHead>
                        <TableHead className="text-right">Chi phí</TableHead>
                        <TableHead>Ghi chú</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessionShares.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="py-8 text-center text-[var(--color-muted-foreground)]"
                          >
                            Chưa tham gia buổi đánh nào
                          </TableCell>
                        </TableRow>
                      ) : (
                        sessionShares.map((share) => (
                          <TableRow key={share.id}>
                            <TableCell>
                              <Link
                                href={buildSessionDetailPath(
                                  clubId,
                                  share.session.id,
                                )}
                                className="font-medium text-[var(--primary)] hover:text-[var(--primary-active)] hover:underline"
                              >
                                {formatSessionDate(share.session.date)}
                              </Link>
                            </TableCell>
                            <TableCell>
                              {formatCourtType(share.session.courtType)}
                            </TableCell>
                            <TableCell>
                              {share.session.shuttleType?.name ?? "—"}
                            </TableCell>
                            <TableCell className="font-number text-right">
                              {formatVND(share.amount)}
                            </TableCell>
                            <TableCell>{share.session.note ?? "—"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                }
              />

              {sessionsPagination.total > 0 && (
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    {sessionsPagination.total} buổi · trang{" "}
                    {sessionsPagination.page}/{sessionsPagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    {sessionsPagination.page > 1 ? (
                      <Button asChild variant="outline" size="sm">
                        <Link
                          href={buildMemberHistoryPath(clubId, memberId, {
                            sessionPage: sessionsPagination.page - 1,
                          })}
                        >
                          Trước
                        </Link>
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" disabled>
                        Trước
                      </Button>
                    )}
                    {sessionsPagination.page < sessionsPagination.totalPages ? (
                      <Button asChild variant="outline" size="sm">
                        <Link
                          href={buildMemberHistoryPath(clubId, memberId, {
                            sessionPage: sessionsPagination.page + 1,
                          })}
                        >
                          Sau
                        </Link>
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" disabled>
                        Sau
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="transactions">
          <Card>
            <CardContent className="pt-6">
              <ResponsiveDataView
                mobile={
                  transactions.length === 0 ? (
                    <MobileDataEmpty>Chưa có giao dịch nào</MobileDataEmpty>
                  ) : (
                    <MobileDataList>
                      {transactions.map((transaction) => (
                        <MobileDataCard
                          key={transaction.id}
                          title={formatDate(transaction.date)}
                        >
                          <MobileDataFields>
                            <MobileDataField label="Loại">
                              {INCOME_CATEGORY_LABELS[transaction.category] ??
                                transaction.category}
                            </MobileDataField>
                            <MobileDataField
                              label="Số tiền"
                              valueClassName="font-number text-trading-up text-right"
                            >
                              {formatVND(transaction.amount)}
                            </MobileDataField>
                            <MobileDataField label="Ghi chú" fullWidth>
                              {transaction.note ?? "—"}
                            </MobileDataField>
                          </MobileDataFields>
                        </MobileDataCard>
                      ))}
                    </MobileDataList>
                  )
                }
                desktop={
                  <Table minWidth="32rem">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ngày</TableHead>
                        <TableHead>Loại</TableHead>
                        <TableHead className="text-right">Số tiền</TableHead>
                        <TableHead>Ghi chú</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="py-8 text-center text-[var(--color-muted-foreground)]"
                          >
                            Chưa có giao dịch nào
                          </TableCell>
                        </TableRow>
                      ) : (
                        transactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>{formatDate(transaction.date)}</TableCell>
                            <TableCell>
                              {INCOME_CATEGORY_LABELS[transaction.category] ??
                                transaction.category}
                            </TableCell>
                            <TableCell className="font-number text-right text-trading-up">
                              {formatVND(transaction.amount)}
                            </TableCell>
                            <TableCell>{transaction.note ?? "—"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                }
              />
            </CardContent>
          </Card>
        </TabsContent>
        {tournamentMembers.length > 0 && (
          <TabsContent value="tournaments">
            <Card>
              <CardContent className="pt-6">
                <ResponsiveDataView
                  mobile={
                    <MobileDataList>
                      {tournamentMembers.map((item) => (
                        <MobileDataCard
                          key={item.id}
                          title={
                            <>
                              {item.tournament.name}
                              {item.tournament.date
                                ? ` · ${formatDate(item.tournament.date)}`
                                : ""}
                            </>
                          }
                        >
                          <MobileDataFields>
                            <MobileDataField
                              label="Phần chia"
                              valueClassName="font-number text-right"
                            >
                              {formatVND(item.shareCost)}
                            </MobileDataField>
                            <MobileDataField
                              label="Chi phí thêm"
                              valueClassName="font-number text-right"
                            >
                              {formatVND(item.additionalCost)}
                            </MobileDataField>
                            <MobileDataField
                              label="Tổng"
                              valueClassName="font-number text-right"
                            >
                              {formatVND(item.amount)}
                            </MobileDataField>
                            <MobileDataField label="Ghi chú" fullWidth>
                              {item.additionalNote ?? "—"}
                            </MobileDataField>
                            <MobileDataField label="Quỹ" fullWidth>
                              <Badge
                                variant={
                                  item.countsToBudget ? "default" : "secondary"
                                }
                              >
                                {item.countsToBudget
                                  ? "Tính vào quỹ"
                                  : "Trả trực tiếp"}
                              </Badge>
                            </MobileDataField>
                          </MobileDataFields>
                        </MobileDataCard>
                      ))}
                    </MobileDataList>
                  }
                  desktop={
                    <Table minWidth="40rem">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Giải</TableHead>
                          <TableHead className="text-right">Phần chia</TableHead>
                          <TableHead className="text-right">Chi phí thêm</TableHead>
                          <TableHead>Ghi chú</TableHead>
                          <TableHead className="text-right">Tổng</TableHead>
                          <TableHead>Quỹ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tournamentMembers.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              {item.tournament.name}
                              {item.tournament.date
                                ? ` · ${formatDate(item.tournament.date)}`
                                : ""}
                            </TableCell>
                            <TableCell className="font-number text-right">
                              {formatVND(item.shareCost)}
                            </TableCell>
                            <TableCell className="font-number text-right">
                              {formatVND(item.additionalCost)}
                            </TableCell>
                            <TableCell>{item.additionalNote ?? "—"}</TableCell>
                            <TableCell className="font-number text-right">
                              {formatVND(item.amount)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  item.countsToBudget ? "default" : "secondary"
                                }
                              >
                                {item.countsToBudget
                                  ? "Tính vào quỹ"
                                  : "Trả trực tiếp"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  }
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}
        {partyMembers.length > 0 && (
          <TabsContent value="parties">
            <Card>
              <CardContent className="pt-6">
                <ResponsiveDataView
                  mobile={
                    <MobileDataList>
                      {partyMembers.map((item) => (
                        <MobileDataCard
                          key={item.id}
                          title={
                            item.party.date
                              ? formatDate(item.party.date)
                              : "Liên hoan"
                          }
                        >
                          <MobileDataFields>
                            <MobileDataField label="Địa điểm">
                              {item.party.location ?? item.party.note ?? "—"}
                            </MobileDataField>
                            <MobileDataField
                              label="Số tiền"
                              valueClassName="font-number text-right"
                            >
                              {formatVND(item.amount)}
                            </MobileDataField>
                            <MobileDataField label="Quỹ" fullWidth>
                              <Badge
                                variant={
                                  item.countsToBudget ? "default" : "secondary"
                                }
                              >
                                {item.countsToBudget
                                  ? "Tính vào quỹ"
                                  : "Trả trực tiếp"}
                              </Badge>
                            </MobileDataField>
                          </MobileDataFields>
                        </MobileDataCard>
                      ))}
                    </MobileDataList>
                  }
                  desktop={
                    <Table minWidth="32rem">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ngày</TableHead>
                          <TableHead>Địa điểm</TableHead>
                          <TableHead className="text-right">Số tiền</TableHead>
                          <TableHead>Quỹ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {partyMembers.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              {item.party.date ? formatDate(item.party.date) : "—"}
                            </TableCell>
                            <TableCell>
                              {item.party.location ?? item.party.note ?? "—"}
                            </TableCell>
                            <TableCell className="font-number text-right">
                              {formatVND(item.amount)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  item.countsToBudget ? "default" : "secondary"
                                }
                              >
                                {item.countsToBudget
                                  ? "Tính vào quỹ"
                                  : "Trả trực tiếp"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  }
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
