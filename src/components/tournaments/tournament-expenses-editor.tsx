"use client";

import { type Dispatch, type SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  MobileDataList,
  MobileEditorField,
  ResponsiveDataView,
} from "@/components/ui/mobile-data-list";
import {
  CLUB_FUND_PAYER_VALUE,
  type TournamentExpensePayload,
} from "@/lib/domain/tournaments";

type Member = { id: string; name: string };

export type TournamentExpenseState = TournamentExpensePayload & {
  clientId: string;
};

function createEmptyExpense(): TournamentExpenseState {
  return {
    clientId: crypto.randomUUID(),
    expenseName: "",
    paidByMemberId: null,
    amount: 0,
  };
}

export function buildInitialTournamentExpenses(
  expenses: {
    id: string;
    expenseName: string;
    amount: number;
    paidByMember: { id: string } | null;
  }[],
): TournamentExpenseState[] {
  return expenses.map((expense) => ({
    clientId: expense.id,
    expenseName: expense.expenseName,
    paidByMemberId: expense.paidByMember?.id ?? null,
    amount: expense.amount,
  }));
}

export function TournamentExpensesEditor({
  members,
  expenses,
  onChange,
}: {
  members: Member[];
  expenses: TournamentExpenseState[];
  onChange: Dispatch<SetStateAction<TournamentExpenseState[]>>;
}) {
  function updateExpense(
    clientId: string,
    patch: Partial<TournamentExpenseState>,
  ) {
    onChange((current) =>
      current.map((row) =>
        row.clientId === clientId ? { ...row, ...patch } : row,
      ),
    );
  }

  function removeExpense(clientId: string) {
    onChange((current) => current.filter((row) => row.clientId !== clientId));
  }

  function addExpense() {
    onChange((current) => [...current, createEmptyExpense()]);
  }

  const serializedExpenses = expenses
    .filter((row) => row.expenseName.trim())
    .map(({ expenseName, paidByMemberId, amount }) => ({
      expenseName: expenseName.trim(),
      paidByMemberId,
      amount,
    }));

  return (
    <div className="space-y-3 md:col-span-2">
      <Label>Chi phí giải</Label>
      <p className="text-sm text-[var(--color-muted-foreground)]">
        Chi phí do thành viên chi sẽ trừ vào tổng phải trả của họ, không tính
        vào quỹ.
      </p>
      <div className="rounded-md border">
        <ResponsiveDataView
          mobile={
            expenses.length === 0 ? (
              <MobileDataEmpty>Chưa có chi phí giải</MobileDataEmpty>
            ) : (
              <MobileDataList className="p-2">
                {expenses.map((expense) => (
                  <MobileDataCard
                    key={expense.clientId}
                    actions={
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExpense(expense.clientId)}
                      >
                        Xóa
                      </Button>
                    }
                  >
                    <div className="space-y-3">
                      <MobileEditorField label="Chi phí">
                        <Input
                          value={expense.expenseName}
                          placeholder="Tên chi phí"
                          onChange={(event) =>
                            updateExpense(expense.clientId, {
                              expenseName: event.target.value,
                            })
                          }
                        />
                      </MobileEditorField>
                      <MobileEditorField label="Người chi">
                        <Select
                          value={expense.paidByMemberId ?? CLUB_FUND_PAYER_VALUE}
                          onValueChange={(value) =>
                            updateExpense(expense.clientId, {
                              paidByMemberId:
                                value === CLUB_FUND_PAYER_VALUE ? null : value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Người chi" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={CLUB_FUND_PAYER_VALUE}>
                              Quỹ
                            </SelectItem>
                            {members.map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                {member.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </MobileEditorField>
                      <MobileEditorField label="Tiền">
                        <CurrencyInput
                          value={expense.amount}
                          placeholder="Số tiền"
                          onValueChange={(amount) =>
                            updateExpense(expense.clientId, { amount })
                          }
                        />
                      </MobileEditorField>
                    </div>
                  </MobileDataCard>
                ))}
              </MobileDataList>
            )
          }
          desktop={
            <Table minWidth="40rem">
              <TableHeader>
                <TableRow>
                  <TableHead>Chi phí</TableHead>
                  <TableHead>Người chi</TableHead>
                  <TableHead className="text-right">Tiền</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-6 text-center text-[var(--color-muted-foreground)]"
                    >
                      Chưa có chi phí giải
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map((expense) => (
                    <TableRow key={expense.clientId}>
                      <TableCell>
                        <Input
                          value={expense.expenseName}
                          placeholder="Tên chi phí"
                          onChange={(event) =>
                            updateExpense(expense.clientId, {
                              expenseName: event.target.value,
                            })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={expense.paidByMemberId ?? CLUB_FUND_PAYER_VALUE}
                          onValueChange={(value) =>
                            updateExpense(expense.clientId, {
                              paidByMemberId:
                                value === CLUB_FUND_PAYER_VALUE ? null : value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Người chi" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={CLUB_FUND_PAYER_VALUE}>
                              Quỹ
                            </SelectItem>
                            {members.map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                {member.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <CurrencyInput
                          value={expense.amount}
                          placeholder="Số tiền"
                          onValueChange={(amount) =>
                            updateExpense(expense.clientId, { amount })
                          }
                        />
                      </TableCell>
                      <TableCell className="w-0 whitespace-nowrap">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExpense(expense.clientId)}
                        >
                          Xóa
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          }
        />
      </div>

      <Button type="button" variant="outline" size="sm" onClick={addExpense}>
        Thêm chi phí
      </Button>

      <input
        type="hidden"
        name="expenseAllocations"
        value={JSON.stringify(serializedExpenses)}
      />
    </div>
  );
}
