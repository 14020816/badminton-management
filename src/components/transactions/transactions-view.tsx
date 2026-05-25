"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createExpenseAction,
  createIncomeAction,
  deleteTransactionAction,
} from "@/actions/transactions";
import { PageHeader } from "@/components/layout/page-header";
import { MutationForm, SubmitButton } from "@/components/form/mutation-form";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";
import {
  EXPENSE_CATEGORY_LABELS,
  INCOME_CATEGORY_LABELS,
  formatDate,
  formatVND,
} from "@/lib/format";

type Member = { id: string; name: string };
type Transaction = {
  id: string;
  type: "EXPENSE" | "INCOME";
  date: Date | null;
  amount: number;
  category: string;
  description: string | null;
  quantity: number | null;
  note: string | null;
  member: { name: string } | null;
};

export function TransactionsView({
  clubId,
  expenses,
  incomes,
  members,
  isAdmin,
}: {
  clubId: string;
  expenses: Transaction[];
  incomes: Transaction[];
  members: Member[];
  isAdmin: boolean;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Giao dịch"
        description="Quản lý khoản chi và khoản thu"
      />

      <Tabs defaultValue="expense" className="min-w-0">
        <TabsList>
          <TabsTrigger value="expense">Khoản chi ({expenses.length})</TabsTrigger>
          <TabsTrigger value="income">Khoản thu ({incomes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="expense" className="space-y-4">
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Thêm khoản chi</CardTitle>
              </CardHeader>
              <CardContent>
                <MutationForm
                  action={createExpenseAction.bind(null, clubId)}
                  successMessage="Đã thêm khoản chi"
                  className="grid gap-4 md:grid-cols-2"
                >
                  <div className="space-y-2">
                    <Label htmlFor="exp-date">Ngày</Label>
                    <Input id="exp-date" name="date" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exp-amount">Số tiền</Label>
                    <Input id="exp-amount" name="amount" type="number" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exp-category">Loại</Label>
                    <select
                      id="exp-category"
                      name="category"
                      defaultValue="COURT_RENTAL"
                      className="flex h-10 w-full rounded-md border border-[var(--color-input)] bg-transparent px-3 py-2 text-sm"
                    >
                      {Object.entries(EXPENSE_CATEGORY_LABELS).map(
                        ([code, label]) => (
                          <option key={code} value={code}>
                            {label}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exp-quantity">Số lượng cầu</Label>
                    <Input id="exp-quantity" name="quantity" type="number" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="exp-description">Mô tả</Label>
                    <Input id="exp-description" name="description" />
                  </div>
                  <div>
                    <SubmitButton pendingText="Đang lưu...">Lưu khoản chi</SubmitButton>
                  </div>
                </MutationForm>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead className="text-right">Số tiền</TableHead>
                    {isAdmin && <TableHead />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{formatDate(tx.date)}</TableCell>
                      <TableCell>
                        {EXPENSE_CATEGORY_LABELS[tx.category] ?? tx.category}
                      </TableCell>
                      <TableCell>
                        {tx.description ?? "—"}
                        {tx.quantity ? ` (${tx.quantity} quả)` : ""}
                      </TableCell>
                      <TableCell className="font-number text-trading-down text-right">
                        {formatVND(tx.amount)}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <ConfirmDeleteButton
                            variant="destructive"
                            size="sm"
                            title="Xóa khoản chi?"
                            description={
                              <>
                                Khoản chi {formatVND(tx.amount)}
                                {tx.description ? ` (${tx.description})` : ""}{" "}
                                sẽ bị xóa. Hành động này không thể hoàn tác.
                              </>
                            }
                            successMessage="Đã xóa giao dịch"
                            onConfirm={async () =>
                              deleteTransactionAction(clubId, tx.id)
                            }
                          />
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="income" className="space-y-4">
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Thêm khoản thu</CardTitle>
              </CardHeader>
              <CardContent>
                <MutationForm
                  action={createIncomeAction.bind(null, clubId)}
                  successMessage="Đã thêm khoản thu"
                  className="grid gap-4 md:grid-cols-2"
                >
                  <div className="space-y-2">
                    <Label htmlFor="inc-date">Ngày</Label>
                    <Input id="inc-date" name="date" type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inc-amount">Số tiền</Label>
                    <Input id="inc-amount" name="amount" type="number" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inc-member">Người đóng</Label>
                    <select
                      id="inc-member"
                      name="memberId"
                      required
                      defaultValue=""
                      className="flex h-10 w-full rounded-md border border-[var(--color-input)] bg-transparent px-3 py-2 text-sm"
                    >
                      <option value="" disabled>
                        Chọn lông thủ
                      </option>
                      {members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inc-category">Loại</Label>
                    <select
                      id="inc-category"
                      name="category"
                      defaultValue="FUND_CONTRIBUTION"
                      className="flex h-10 w-full rounded-md border border-[var(--color-input)] bg-transparent px-3 py-2 text-sm"
                    >
                      {Object.entries(INCOME_CATEGORY_LABELS).map(
                        ([code, label]) => (
                          <option key={code} value={code}>
                            {label}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="inc-note">Ghi chú</Label>
                    <Input id="inc-note" name="note" />
                  </div>
                  <div>
                    <SubmitButton pendingText="Đang lưu...">Lưu khoản thu</SubmitButton>
                  </div>
                </MutationForm>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Người đóng</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Ghi chú</TableHead>
                    <TableHead className="text-right">Số tiền</TableHead>
                    {isAdmin && <TableHead />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomes.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{formatDate(tx.date)}</TableCell>
                      <TableCell>{tx.member?.name ?? "—"}</TableCell>
                      <TableCell>
                        {INCOME_CATEGORY_LABELS[tx.category] ?? tx.category}
                      </TableCell>
                      <TableCell>{tx.note ?? "—"}</TableCell>
                      <TableCell className="font-number text-trading-up text-right">
                        {formatVND(tx.amount)}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <ConfirmDeleteButton
                            variant="destructive"
                            size="sm"
                            title="Xóa khoản thu?"
                            description={
                              <>
                                Khoản thu {formatVND(tx.amount)}
                                {tx.member?.name ? ` của ${tx.member.name}` : ""}
                                {tx.note ? ` (${tx.note})` : ""} sẽ bị xóa.
                                Hành động này không thể hoàn tác.
                              </>
                            }
                            successMessage="Đã xóa giao dịch"
                            onConfirm={async () =>
                              deleteTransactionAction(clubId, tx.id)
                            }
                          />
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
