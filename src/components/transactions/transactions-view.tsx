"use client";

import { useState, type ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  MobileDataCard,
  MobileDataField,
  MobileDataFields,
  MobileDataList,
  ResponsiveDataView,
} from "@/components/ui/mobile-data-list";
import {
  createExpenseAction,
  createIncomeAction,
  deleteTransactionAction,
} from "@/actions/transactions";
import { PageHeader } from "@/components/layout/page-header";
import { MutationForm, SubmitButton } from "@/components/form/mutation-form";
import { FormSelect } from "@/components/form/form-select";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";
import {
  TransactionEditDialog,
  type EditableTransaction,
} from "@/components/transactions/transaction-edit-dialog";
import {
  EXPENSE_CATEGORY_LABELS,
  INCOME_CATEGORY_LABELS,
  formatDate,
  formatVND,
} from "@/lib/format";

type Member = { id: string; name: string };
type Transaction = EditableTransaction & {
  member: { name: string } | null;
};

function TransactionActions({
  clubId,
  transaction,
  onEdit,
  deleteTitle,
  deleteDescription,
}: {
  clubId: string;
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  deleteTitle: string;
  deleteDescription: ReactNode;
}) {
  return (
    <div className="flex shrink-0 gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onEdit(transaction)}
      >
        Sửa
      </Button>
      <ConfirmDeleteButton
        variant="destructive"
        size="sm"
        title={deleteTitle}
        description={deleteDescription}
        successMessage="Đã xóa giao dịch"
        onConfirm={async () => deleteTransactionAction(clubId, transaction.id)}
      />
    </div>
  );
}

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
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(
    null,
  );

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
                    <FormSelect
                      id="exp-category"
                      name="category"
                      defaultValue="COURT_RENTAL"
                      options={Object.entries(EXPENSE_CATEGORY_LABELS).map(
                        ([code, label]) => ({ value: code, label }),
                      )}
                    />
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
              <ResponsiveDataView
                mobile={
                  <MobileDataList>
                    {expenses.map((tx) => (
                      <MobileDataCard
                        key={tx.id}
                        title={formatDate(tx.date)}
                        actions={
                          isAdmin ? (
                            <TransactionActions
                              clubId={clubId}
                              transaction={tx}
                              onEdit={setEditingTransaction}
                              deleteTitle="Xóa khoản chi?"
                              deleteDescription={
                                <>
                                  Khoản chi {formatVND(tx.amount)}
                                  {tx.description ? ` (${tx.description})` : ""}{" "}
                                  sẽ bị xóa. Hành động này không thể hoàn tác.
                                </>
                              }
                            />
                          ) : undefined
                        }
                      >
                        <MobileDataFields>
                          <MobileDataField label="Loại">
                            {EXPENSE_CATEGORY_LABELS[tx.category] ?? tx.category}
                          </MobileDataField>
                          <MobileDataField
                            label="Số tiền"
                            valueClassName="font-number text-trading-down text-right"
                          >
                            {formatVND(tx.amount)}
                          </MobileDataField>
                          <MobileDataField label="Mô tả" fullWidth>
                            {tx.description ?? "—"}
                            {tx.quantity ? ` (${tx.quantity} quả)` : ""}
                          </MobileDataField>
                        </MobileDataFields>
                      </MobileDataCard>
                    ))}
                  </MobileDataList>
                }
                desktop={
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ngày</TableHead>
                        <TableHead>Loại</TableHead>
                        <TableHead>Mô tả</TableHead>
                        <TableHead className="text-right">Số tiền</TableHead>
                        {isAdmin && <TableHead className="w-36">Thao tác</TableHead>}
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
                              <TransactionActions
                                clubId={clubId}
                                transaction={tx}
                                onEdit={setEditingTransaction}
                                deleteTitle="Xóa khoản chi?"
                                deleteDescription={
                                  <>
                                    Khoản chi {formatVND(tx.amount)}
                                    {tx.description ? ` (${tx.description})` : ""}{" "}
                                    sẽ bị xóa. Hành động này không thể hoàn tác.
                                  </>
                                }
                              />
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                }
              />
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
                    <FormSelect
                      id="inc-member"
                      name="memberId"
                      required
                      placeholder="Chọn lông thủ"
                      options={members.map((member) => ({
                        value: member.id,
                        label: member.name,
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inc-category">Loại</Label>
                    <FormSelect
                      id="inc-category"
                      name="category"
                      defaultValue="FUND_CONTRIBUTION"
                      options={Object.entries(INCOME_CATEGORY_LABELS).map(
                        ([code, label]) => ({ value: code, label }),
                      )}
                    />
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
              <ResponsiveDataView
                mobile={
                  <MobileDataList>
                    {incomes.map((tx) => (
                      <MobileDataCard
                        key={tx.id}
                        title={formatDate(tx.date)}
                        actions={
                          isAdmin ? (
                            <TransactionActions
                              clubId={clubId}
                              transaction={tx}
                              onEdit={setEditingTransaction}
                              deleteTitle="Xóa khoản thu?"
                              deleteDescription={
                                <>
                                  Khoản thu {formatVND(tx.amount)}
                                  {tx.member?.name ? ` của ${tx.member.name}` : ""}
                                  {tx.note ? ` (${tx.note})` : ""} sẽ bị xóa.
                                  Hành động này không thể hoàn tác.
                                </>
                              }
                            />
                          ) : undefined
                        }
                      >
                        <MobileDataFields>
                          <MobileDataField label="Người đóng">
                            {tx.member?.name ?? "—"}
                          </MobileDataField>
                          <MobileDataField
                            label="Số tiền"
                            valueClassName="font-number text-trading-up text-right"
                          >
                            {formatVND(tx.amount)}
                          </MobileDataField>
                          <MobileDataField label="Loại">
                            {INCOME_CATEGORY_LABELS[tx.category] ?? tx.category}
                          </MobileDataField>
                          <MobileDataField label="Ghi chú" fullWidth>
                            {tx.note ?? "—"}
                          </MobileDataField>
                        </MobileDataFields>
                      </MobileDataCard>
                    ))}
                  </MobileDataList>
                }
                desktop={
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ngày</TableHead>
                        <TableHead>Người đóng</TableHead>
                        <TableHead>Loại</TableHead>
                        <TableHead>Ghi chú</TableHead>
                        <TableHead className="text-right">Số tiền</TableHead>
                        {isAdmin && <TableHead className="w-36">Thao tác</TableHead>}
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
                              <TransactionActions
                                clubId={clubId}
                                transaction={tx}
                                onEdit={setEditingTransaction}
                                deleteTitle="Xóa khoản thu?"
                                deleteDescription={
                                  <>
                                    Khoản thu {formatVND(tx.amount)}
                                    {tx.member?.name ? ` của ${tx.member.name}` : ""}
                                    {tx.note ? ` (${tx.note})` : ""} sẽ bị xóa.
                                    Hành động này không thể hoàn tác.
                                  </>
                                }
                              />
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                }
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <TransactionEditDialog
        clubId={clubId}
        transaction={editingTransaction}
        members={members}
        open={editingTransaction !== null}
        onOpenChange={(open) => {
          if (!open) setEditingTransaction(null);
        }}
      />
    </div>
  );
}
