"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  createTournamentAction,
  deleteTournamentAction,
  updateTournamentAction,
} from "@/actions/tournaments";
import { PageHeader } from "@/components/layout/page-header";
import { MutationForm, SubmitButton } from "@/components/form/mutation-form";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";
import {
  TournamentMemberCostsEditor,
  buildInitialTournamentAllocationsFromTournament,
  memberPaidExpenseForMember,
  type TournamentMemberAllocationState,
} from "@/components/tournaments/tournament-member-costs-editor";
import {
  TournamentExpensesEditor,
  buildInitialTournamentExpenses,
  type TournamentExpenseState,
} from "@/components/tournaments/tournament-expenses-editor";
import { formatDate, formatDateInput, formatVND } from "@/lib/format";
import { calcTournamentMemberCredit } from "@/lib/domain/tournaments";

type Member = { id: string; name: string };

type Tournament = {
  id: string;
  name: string;
  date: Date | null;
  note: string | null;
  brackets: {
    order: number;
    groupAMember: { name: string } | null;
    groupBMember: { name: string } | null;
    practiceGroupName: string | null;
    practiceGroupMembers: string | null;
  }[];
  members: {
    id: string;
    shareCost: number;
    additionalCost: number;
    additionalNote: string | null;
    amount: number;
    countsToBudget: boolean;
    member: { id: string; name: string };
  }[];
  expenses: {
    id: string;
    expenseName: string;
    paidBy: string;
    amount: number;
    surplusAmount: number;
    linkSurplusToBudget: boolean;
    paidByMember: { id: string; name: string } | null;
  }[];
  surplusIncomeMemberIds: string[];
};

function TournamentExpensesTable({
  expenses,
}: {
  expenses: Tournament["expenses"];
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Chi phí</TableHead>
          <TableHead>Người chi</TableHead>
          <TableHead className="text-right">Tiền</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {expenses.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={3}
              className="py-6 text-center text-[var(--color-muted-foreground)]"
            >
              Chưa có chi phí giải
            </TableCell>
          </TableRow>
        ) : (
          expenses.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell>{expense.expenseName}</TableCell>
              <TableCell>
                {expense.paidByMember?.name ?? expense.paidBy}
              </TableCell>
              <TableCell className="font-number text-right">
                {formatVND(expense.amount)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

function TournamentBracketsTable({
  brackets,
}: {
  brackets: Tournament["brackets"];
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>STT</TableHead>
          <TableHead>Bảng A</TableHead>
          <TableHead>Bảng B</TableHead>
          <TableHead>Nhóm tập</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {brackets.map((row) => (
          <TableRow key={row.order}>
            <TableCell>{row.order}</TableCell>
            <TableCell>{row.groupAMember?.name ?? "—"}</TableCell>
            <TableCell>{row.groupBMember?.name ?? "—"}</TableCell>
            <TableCell>
              {row.practiceGroupName
                ? `${row.practiceGroupName}: ${row.practiceGroupMembers ?? ""}`
                : "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function TournamentFormFields({
  members,
  allocations,
  onAllocationsChange,
  expenses,
  onExpensesChange,
  includeExpenses = false,
  tournamentName,
  tournamentDate,
  defaultValues,
}: {
  members: Member[];
  allocations: TournamentMemberAllocationState[];
  onAllocationsChange: Dispatch<SetStateAction<TournamentMemberAllocationState[]>>;
  expenses?: TournamentExpenseState[];
  onExpensesChange?: Dispatch<SetStateAction<TournamentExpenseState[]>>;
  includeExpenses?: boolean;
  tournamentName?: string;
  tournamentDate?: Date | null;
  defaultValues?: {
    name?: string;
    date?: Date | null;
    note?: string | null;
  };
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="name" required>
          Tên giải
        </Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={defaultValues?.name ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="date">Ngày</Label>
        <Input
          id="date"
          name="date"
          type="date"
          defaultValue={
            defaultValues?.date ? formatDateInput(defaultValues.date) : ""
          }
        />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="note">Ghi chú</Label>
        <Input id="note" name="note" defaultValue={defaultValues?.note ?? ""} />
      </div>
      {includeExpenses && expenses && onExpensesChange && (
        <TournamentExpensesEditor
          members={members}
          expenses={expenses}
          onChange={onExpensesChange}
        />
      )}
      <TournamentMemberCostsEditor
        members={members}
        allocations={allocations}
        onChange={onAllocationsChange}
        expenses={expenses ?? []}
        tournamentName={tournamentName}
        tournamentDate={tournamentDate ?? defaultValues?.date ?? null}
      />
    </>
  );
}

export function TournamentsView({
  clubId,
  tournaments,
  members,
  isAdmin,
}: {
  clubId: string;
  tournaments: Tournament[];
  members: Member[];
  isAdmin: boolean;
}) {
  const [createAllocations, setCreateAllocations] = useState<
    TournamentMemberAllocationState[]
  >([]);
  const [editingTournamentId, setEditingTournamentId] = useState<string | null>(
    null,
  );
  const [editAllocations, setEditAllocations] = useState<
    TournamentMemberAllocationState[]
  >([]);
  const [editExpenses, setEditExpenses] = useState<TournamentExpenseState[]>(
    [],
  );

  function startEdit(tournament: Tournament) {
    setEditingTournamentId(tournament.id);
    setEditAllocations(
      buildInitialTournamentAllocationsFromTournament(
        tournament.members,
        tournament.expenses,
        tournament.surplusIncomeMemberIds,
      ),
    );
    setEditExpenses(buildInitialTournamentExpenses(tournament.expenses));
  }

  function cancelEdit() {
    setEditingTournamentId(null);
    setEditAllocations([]);
    setEditExpenses([]);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Giải đấu"
        description="Phân bảng thi đấu và chi phí từng thành viên"
      />

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Tạo giải đấu</CardTitle>
          </CardHeader>
          <CardContent>
            <MutationForm
              action={createTournamentAction.bind(null, clubId)}
              successMessage="Đã tạo giải đấu"
              className="grid gap-4 md:grid-cols-2"
              onSuccess={() => setCreateAllocations([])}
            >
              <TournamentFormFields
                members={members}
                allocations={createAllocations}
                onAllocationsChange={setCreateAllocations}
              />
              <div className="md:col-span-2">
                <SubmitButton pendingText="Đang tạo...">Tạo giải</SubmitButton>
              </div>
            </MutationForm>
          </CardContent>
        </Card>
      )}

      {tournaments.map((tournament) => {
        const isEditing = editingTournamentId === tournament.id;

        return (
          <Card key={tournament.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle>{tournament.name}</CardTitle>
                {tournament.date && (
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    {formatDate(tournament.date)}
                  </p>
                )}
              </div>
              {isAdmin && !isEditing && (
                <div className="flex shrink-0 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={() => startEdit(tournament)}
                  >
                    Sửa
                  </Button>
                  <ConfirmDeleteButton
                    size="sm"
                    variant="destructive"
                    title="Xóa giải đấu?"
                    description={
                      <>
                        Giải &quot;{tournament.name}&quot;
                        {tournament.date
                          ? ` ngày ${formatDate(tournament.date)}`
                          : ""}{" "}
                        sẽ bị xóa cùng chi phí và khoản thu liên quan. Hành
                        động này không thể hoàn tác.
                      </>
                    }
                    successMessage="Đã xóa giải đấu"
                    onConfirm={async () => {
                      const formData = new FormData();
                      formData.set("tournamentId", tournament.id);
                      await deleteTournamentAction(clubId, formData);
                    }}
                  />
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {tournament.note && !isEditing && (
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  {tournament.note}
                </p>
              )}

              <div>
                <h3 className="mb-2 font-semibold">Phân bảng A / B</h3>
                <TournamentBracketsTable brackets={tournament.brackets} />
              </div>

              {isEditing ? (
                <MutationForm
                  action={updateTournamentAction.bind(null, clubId)}
                  successMessage="Đã cập nhật giải đấu"
                  className="grid gap-4 md:grid-cols-2"
                  onSuccess={cancelEdit}
                >
                  <input
                    type="hidden"
                    name="tournamentId"
                    value={tournament.id}
                  />
                  <TournamentFormFields
                    members={members}
                    allocations={editAllocations}
                    onAllocationsChange={setEditAllocations}
                    expenses={editExpenses}
                    onExpensesChange={setEditExpenses}
                    includeExpenses
                    tournamentName={tournament.name}
                    tournamentDate={tournament.date}
                    defaultValues={{
                      name: tournament.name,
                      date: tournament.date,
                      note: tournament.note,
                    }}
                  />
                  <div className="flex gap-2 md:col-span-2">
                    <SubmitButton pendingText="Đang lưu...">Lưu</SubmitButton>
                    <Button type="button" variant="outline" onClick={cancelEdit}>
                      Hủy
                    </Button>
                  </div>
                </MutationForm>
              ) : (
                <>
                  <div>
                    <h3 className="mb-2 font-semibold">Chi phí thành viên</h3>
                    <Table minWidth="36rem">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Thành viên</TableHead>
                          <TableHead className="text-right">Phần chia</TableHead>
                          <TableHead className="text-right">Chi phí thêm</TableHead>
                          <TableHead className="text-right">Đã chi</TableHead>
                          <TableHead>Ghi chú</TableHead>
                          <TableHead className="text-right">Tổng</TableHead>
                          <TableHead>Quỹ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tournament.members.map((member) => {
                          const memberPaidExpense = memberPaidExpenseForMember(
                            tournament.expenses,
                            member.member.id,
                          );
                          const credit = calcTournamentMemberCredit(member.amount);
                          const hasSurplusIncome =
                            tournament.surplusIncomeMemberIds.includes(
                              member.member.id,
                            );

                          return (
                          <TableRow key={member.id}>
                            <TableCell>{member.member.name}</TableCell>
                            <TableCell className="font-number text-right">
                              {formatVND(member.shareCost)}
                            </TableCell>
                            <TableCell className="font-number text-right">
                              {formatVND(member.additionalCost)}
                            </TableCell>
                            <TableCell className="font-number text-right text-[var(--color-muted-foreground)]">
                              {memberPaidExpense > 0
                                ? `-${formatVND(memberPaidExpense)}`
                                : "—"}
                            </TableCell>
                            <TableCell>{member.additionalNote ?? "—"}</TableCell>
                            <TableCell
                              className={`font-number text-right font-medium ${member.amount < 0 ? "text-[var(--color-success)]" : ""}`}
                            >
                              {formatVND(member.amount)}
                            </TableCell>
                            <TableCell>
                              <Badge                               
                                variant={
                                  member.countsToBudget ? "default" : "secondary"
                                }
                              >
                                {member.countsToBudget
                                  ? "Tính vào quỹ"
                                  : credit > 0 && hasSurplusIncome
                                    ? `Khoản thu ${formatVND(credit)}`
                                    : "Trả trực tiếp"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  <div>
                    <h3 className="mb-2 font-semibold">Chi phí giải</h3>
                    <TournamentExpensesTable expenses={tournament.expenses} />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
