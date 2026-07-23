"use client";

import {
  Fragment,
  useEffect,
  useMemo,
  type Dispatch,
  type SetStateAction,
} from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
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
  MobileEditorField,
  ResponsiveDataView,
} from "@/components/ui/mobile-data-list";
import {
  buildTournamentSurplusIncomeNote,
  calcTournamentExpenseTotal,
  calcTournamentMemberAmount,
  calcTournamentMemberCredit,
  calcTournamentShareCostPerMember,
  linkedTournamentExpenseSurplusByMember,
  memberPaidExpenseTotalByMember,
  type TournamentMemberAllocationPayload,
} from "@/lib/domain/tournaments";
import { formatVND } from "@/lib/format";

type Member = { id: string; name: string };

type ExpenseForShareCost = {
  expenseName: string;
  amount: number;
  paidByMemberId: string | null;
};

export type TournamentMemberAllocationState =
  TournamentMemberAllocationPayload & {
    memberId: string;
    shareCost: number;
    additionalCost: number;
    additionalNote: string | null;
    countsToBudget: boolean;
  };

export function TournamentMemberCostsEditor({
  members,
  allocations,
  onChange,
  expenses = [],
  tournamentName,
  tournamentDate,
}: {
  members: Member[];
  allocations: TournamentMemberAllocationState[];
  onChange: Dispatch<SetStateAction<TournamentMemberAllocationState[]>>;
  expenses?: ExpenseForShareCost[];
  tournamentName?: string;
  tournamentDate?: Date | null;
}) {
  const surplusIncomeNote =
    tournamentName !== undefined
      ? buildTournamentSurplusIncomeNote(tournamentName, tournamentDate)
      : null;

  const selectedIds = useMemo(
    () => new Set(allocations.map((row) => row.memberId)),
    [allocations],
  );

  const totalExpense = useMemo(
    () => calcTournamentExpenseTotal(expenses),
    [expenses],
  );

  const shareCostPerMember = useMemo(
    () => calcTournamentShareCostPerMember(totalExpense, allocations.length),
    [allocations.length, totalExpense],
  );

  const paidByMember = useMemo(
    () => memberPaidExpenseTotalByMember(expenses),
    [expenses],
  );

  useEffect(() => {
    onChange((current) => {
      if (current.length === 0) return current;

      let changed = false;
      const next = current.map((row) => {
        if (row.shareCost === shareCostPerMember) return row;
        changed = true;
        return { ...row, shareCost: shareCostPerMember };
      });

      return changed ? next : current;
    });
  }, [onChange, shareCostPerMember]);

  const allocatedTotal = allocations.reduce((sum, row) => {
    const memberPaidExpense = paidByMember.get(row.memberId) ?? 0;
    return (
      sum +
      calcTournamentMemberAmount({
        shareCost: row.shareCost,
        additionalCost: row.additionalCost,
        memberPaidExpense,
      })
    );
  }, 0);

  function toggleMember(memberId: string) {
    onChange((current) => {
      const exists = current.some((row) => row.memberId === memberId);
      if (exists) {
        return current.filter((row) => row.memberId !== memberId);
      }
      return [
        ...current,
        {
          memberId,
          shareCost: shareCostPerMember,
          additionalCost: 0,
          additionalNote: null,
          countsToBudget: false,
        },
      ];
    });
  }

  function updateRow(
    memberId: string,
    patch: Partial<TournamentMemberAllocationState>,
  ) {
    onChange((current) =>
      current.map((row) =>
        row.memberId === memberId ? { ...row, ...patch } : row,
      ),
    );
  }

  return (
    <div className="space-y-4 md:col-span-2">
      <div className="space-y-2">
        <Label required>Người tham gia</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {members.map((member) => (
            <label
              key={member.id}
              className="flex items-center gap-2 rounded-md border p-2"
            >
              <Checkbox
                checked={selectedIds.has(member.id)}
                onCheckedChange={() => toggleMember(member.id)}
              />
              <span className="text-sm">{member.name}</span>
            </label>
          ))}
        </div>
      </div>

      {allocations.length > 0 && (
        <div className="space-y-3">
          <Label>Chi phí từng người</Label>
          <div className="rounded-md border">
            <ResponsiveDataView
              mobile={
                <MobileDataList className="p-2">
                  {allocations.map((row) => {
                    const member = members.find(
                      (item) => item.id === row.memberId,
                    );
                    if (!member) return null;

                    const memberPaidExpense = paidByMember.get(row.memberId) ?? 0;
                    const total = calcTournamentMemberAmount({
                      shareCost: row.shareCost,
                      additionalCost: row.additionalCost,
                      memberPaidExpense,
                    });
                    const credit = calcTournamentMemberCredit(total);

                    return (
                      <Fragment key={row.memberId}>
                        <MobileDataCard title={member.name}>
                          <div className="space-y-3">
                            <MobileDataFields columns={2}>
                              <MobileDataField
                                label="Phần chia"
                                valueClassName="font-number text-right"
                              >
                                {formatVND(row.shareCost)}
                              </MobileDataField>
                              <MobileDataField
                                label="Đã chi"
                                valueClassName="font-number text-right text-[var(--color-muted-foreground)]"
                              >
                                {memberPaidExpense > 0
                                  ? `-${formatVND(memberPaidExpense)}`
                                  : "—"}
                              </MobileDataField>
                            </MobileDataFields>
                            <MobileEditorField label="Chi phí thêm">
                              <CurrencyInput
                                value={row.additionalCost}
                                onValueChange={(additionalCost) =>
                                  updateRow(row.memberId, { additionalCost })
                                }
                              />
                            </MobileEditorField>
                            <MobileEditorField label="Ghi chú">
                              <Input
                                value={row.additionalNote ?? ""}
                                placeholder="VD: Thua kèo bia"
                                onChange={(event) =>
                                  updateRow(row.memberId, {
                                    additionalNote: event.target.value || null,
                                  })
                                }
                              />
                            </MobileEditorField>
                            <MobileDataField
                              label="Tổng"
                              valueClassName={`font-number font-medium ${total < 0 ? "text-[var(--color-success)]" : ""}`}
                            >
                              {formatVND(total)}
                            </MobileDataField>
                            {credit > 0 ? (
                              <label className="flex items-start gap-2 text-sm">
                                <Checkbox
                                  checked={row.countsToBudget}
                                  onCheckedChange={(checked) =>
                                    updateRow(row.memberId, {
                                      countsToBudget: checked === true,
                                    })
                                  }
                                />
                                <span>
                                  Chi nhiều hơn phần phải trả. Tạo khoản thu{" "}
                                  <span className="font-number font-medium">
                                    {formatVND(credit)}
                                  </span>{" "}
                                  cho {member.name}
                                  {surplusIncomeNote
                                    ? ` (${surplusIncomeNote})`
                                    : ""}
                                </span>
                              </label>
                            ) : (
                              <MobileEditorField label="Tính vào quỹ">
                                <label className="flex items-center gap-2">
                                  <Checkbox
                                    checked={row.countsToBudget}
                                    onCheckedChange={(checked) =>
                                      updateRow(row.memberId, {
                                        countsToBudget: checked === true,
                                      })
                                    }
                                    disabled={total === 0}
                                    aria-label={`Tính vào quỹ cho ${member.name}`}
                                  />
                                  <span className="text-sm">Tính vào quỹ</span>
                                </label>
                              </MobileEditorField>
                            )}
                          </div>
                        </MobileDataCard>
                      </Fragment>
                    );
                  })}
                </MobileDataList>
              }
              desktop={
                <Table minWidth="44rem">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Thành viên</TableHead>
                      <TableHead className="text-right">Phần chia</TableHead>
                      <TableHead className="text-right">Chi phí thêm</TableHead>
                      <TableHead className="text-right">Đã chi</TableHead>
                      <TableHead>Ghi chú</TableHead>
                      <TableHead className="text-right">Tổng</TableHead>
                      <TableHead className="text-center">Tính vào quỹ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allocations.map((row) => {
                      const member = members.find(
                        (item) => item.id === row.memberId,
                      );
                      if (!member) return null;

                      const memberPaidExpense = paidByMember.get(row.memberId) ?? 0;
                      const total = calcTournamentMemberAmount({
                        shareCost: row.shareCost,
                        additionalCost: row.additionalCost,
                        memberPaidExpense,
                      });
                      const credit = calcTournamentMemberCredit(total);

                      return (
                        <Fragment key={row.memberId}>
                          <TableRow>
                            <TableCell className="font-medium">
                              {member.name}
                            </TableCell>
                            <TableCell className="font-number text-right">
                              {formatVND(row.shareCost)}
                            </TableCell>
                            <TableCell>
                              <CurrencyInput
                                value={row.additionalCost}
                                onValueChange={(additionalCost) =>
                                  updateRow(row.memberId, { additionalCost })
                                }
                              />
                            </TableCell>
                            <TableCell className="font-number text-right text-[var(--color-muted-foreground)]">
                              {memberPaidExpense > 0
                                ? `-${formatVND(memberPaidExpense)}`
                                : "—"}
                            </TableCell>
                            <TableCell>
                              <Input
                                value={row.additionalNote ?? ""}
                                placeholder="VD: Thua kèo bia"
                                onChange={(event) =>
                                  updateRow(row.memberId, {
                                    additionalNote: event.target.value || null,
                                  })
                                }
                              />
                            </TableCell>
                            <TableCell
                              className={`font-number text-right font-medium ${total < 0 ? "text-[var(--color-success)]" : ""}`}
                            >
                              {formatVND(total)}
                            </TableCell>
                            <TableCell className="text-center">
                              {credit > 0 ? (
                                "—"
                              ) : (
                                <Checkbox
                                  checked={row.countsToBudget}
                                  onCheckedChange={(checked) =>
                                    updateRow(row.memberId, {
                                      countsToBudget: checked === true,
                                    })
                                  }
                                  disabled={total === 0}
                                  aria-label={`Tính vào quỹ cho ${member.name}`}
                                />
                              )}
                            </TableCell>
                          </TableRow>
                          {credit > 0 && (
                            <TableRow>
                              <TableCell colSpan={7} className="pt-0">
                                <label className="flex items-start gap-2 text-sm">
                                  <Checkbox
                                    checked={row.countsToBudget}
                                    onCheckedChange={(checked) =>
                                      updateRow(row.memberId, {
                                        countsToBudget: checked === true,
                                      })
                                    }
                                  />
                                  <span>
                                    Chi nhiều hơn phần phải trả. Tạo khoản thu{" "}
                                    <span className="font-number font-medium">
                                      {formatVND(credit)}
                                    </span>{" "}
                                    cho {member.name}
                                    {surplusIncomeNote
                                      ? ` (${surplusIncomeNote})`
                                      : ""}
                                  </span>
                                </label>
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              }
            />
          </div>

          <p className="text-sm text-[var(--color-muted-foreground)]">
            Tổng chi phí giải:{" "}
            <span className="font-number font-medium text-[var(--body)]">
              {formatVND(totalExpense)}
            </span>
            {" · "}
            Phần chia:{" "}
            <span className="font-number font-medium text-[var(--body)]">
              {formatVND(shareCostPerMember)}
            </span>
            / người
            {" · "}
            Tổng phân bổ:{" "}
            <span className="font-number font-medium text-[var(--body)]">
              {formatVND(allocatedTotal)}
            </span>
            {" · "}
            {allocations.length} người tham gia
          </p>
        </div>
      )}

      <input
        type="hidden"
        name="memberAllocations"
        value={JSON.stringify(allocations)}
      />
    </div>
  );
}

export function buildInitialTournamentAllocations(
  members: {
    memberId: string;
    shareCost: number;
    additionalCost: number;
    additionalNote: string | null;
    countsToBudget: boolean;
  }[],
): TournamentMemberAllocationState[] {
  return members.map((member) => ({
    memberId: member.memberId,
    shareCost: member.shareCost,
    additionalCost: member.additionalCost,
    additionalNote: member.additionalNote,
    countsToBudget: member.countsToBudget,
  }));
}

export function buildInitialTournamentAllocationsFromTournament(
  members: {
    member: { id: string };
    shareCost: number;
    additionalCost: number;
    additionalNote: string | null;
    countsToBudget: boolean;
  }[],
  expenses: {
    expenseName: string;
    amount: number;
    paidByMember: { id: string } | null;
    surplusAmount: number;
    linkSurplusToBudget: boolean;
  }[],
  surplusIncomeMemberIds: string[] = [],
) {
  const surplusByMember = linkedTournamentExpenseSurplusByMember(
    expenses.map((expense) => ({
      paidByMemberId: expense.paidByMember?.id ?? null,
      surplusAmount: expense.surplusAmount,
      linkSurplusToBudget: expense.linkSurplusToBudget,
    })),
  );
  const shareCost = calcTournamentShareCostPerMember(
    calcTournamentExpenseTotal(expenses),
    members.length,
  );
  const paidByMember = memberPaidExpenseTotalByMember(
    expenses.map((expense) => ({
      paidByMemberId: expense.paidByMember?.id ?? null,
      amount: expense.amount,
      expenseName: expense.expenseName,
    })),
  );
  const linkedSurplus = new Set(surplusIncomeMemberIds);

  return buildInitialTournamentAllocations(
    members.map((member) => {
      const memberPaidExpense = paidByMember.get(member.member.id) ?? 0;
      const additionalCost = Math.max(
        0,
        member.additionalCost - (surplusByMember.get(member.member.id) ?? 0),
      );
      const amount = calcTournamentMemberAmount({
        shareCost,
        additionalCost,
        memberPaidExpense,
      });
      const credit = calcTournamentMemberCredit(amount);

      return {
        memberId: member.member.id,
        shareCost,
        additionalCost,
        additionalNote: member.additionalNote,
        countsToBudget:
          credit > 0
            ? linkedSurplus.has(member.member.id)
            : member.countsToBudget,
      };
    }),
  );
}

export function memberPaidExpenseForMember(
  expenses: {
    amount: number;
    paidByMember: { id: string } | null;
  }[],
  memberId: string,
): number {
  return expenses.reduce((sum, expense) => {
    if (expense.paidByMember?.id !== memberId) return sum;
    return sum + expense.amount;
  }, 0);
}
