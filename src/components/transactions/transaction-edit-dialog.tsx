"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { MutationForm, SubmitButton } from "@/components/form/mutation-form";
import { FormSelect } from "@/components/form/form-select";
import {
  updateExpenseAction,
  updateIncomeAction,
} from "@/actions/transactions";
import {
  EXPENSE_CATEGORY_LABELS,
  INCOME_CATEGORY_LABELS,
  formatDateInput,
} from "@/lib/format";

export type EditableTransaction = {
  id: string;
  type: "EXPENSE" | "INCOME";
  date: Date | null;
  amount: number;
  category: string;
  description: string | null;
  quantity: number | null;
  note: string | null;
  memberId: string | null;
};

type Member = { id: string; name: string };

export function TransactionEditDialog({
  clubId,
  transaction,
  members,
  open,
  onOpenChange,
}: {
  clubId: string;
  transaction: EditableTransaction | null;
  members: Member[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!transaction) return null;

  const isExpense = transaction.type === "EXPENSE";
  const title = isExpense ? "Sửa khoản chi" : "Sửa khoản thu";
  const action = isExpense
    ? updateExpenseAction.bind(null, clubId, transaction.id)
    : updateIncomeAction.bind(null, clubId, transaction.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <MutationForm
          key={transaction.id}
          action={action}
          successMessage={isExpense ? "Đã cập nhật khoản chi" : "Đã cập nhật khoản thu"}
          onSuccess={() => onOpenChange(false)}
          className="grid gap-4 md:grid-cols-2"
        >
          <div className="space-y-2">
            <Label htmlFor={`edit-tx-date-${transaction.id}`} required={!isExpense}>
              Ngày
            </Label>
            <Input
              id={`edit-tx-date-${transaction.id}`}
              name="date"
              type="date"
              required={!isExpense}
              defaultValue={transaction.date ? formatDateInput(transaction.date) : ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`edit-tx-amount-${transaction.id}`} required>
              Số tiền
            </Label>
            <CurrencyInput
              id={`edit-tx-amount-${transaction.id}`}
              name="amount"
              required
              defaultValue={transaction.amount}
            />
          </div>

          {isExpense ? (
            <>
              <div className="space-y-2">
                <Label htmlFor={`edit-tx-category-${transaction.id}`}>Loại</Label>
                <FormSelect
                  id={`edit-tx-category-${transaction.id}`}
                  name="category"
                  defaultValue={transaction.category}
                  options={Object.entries(EXPENSE_CATEGORY_LABELS).map(
                    ([code, label]) => ({ value: code, label }),
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`edit-tx-quantity-${transaction.id}`}>
                  Số lượng cầu
                </Label>
                <Input
                  id={`edit-tx-quantity-${transaction.id}`}
                  name="quantity"
                  type="number"
                  defaultValue={transaction.quantity ?? ""}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor={`edit-tx-description-${transaction.id}`}>Mô tả</Label>
                <Input
                  id={`edit-tx-description-${transaction.id}`}
                  name="description"
                  defaultValue={transaction.description ?? ""}
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor={`edit-tx-member-${transaction.id}`} required>
                  Người đóng
                </Label>
                <FormSelect
                  id={`edit-tx-member-${transaction.id}`}
                  name="memberId"
                  required
                  defaultValue={transaction.memberId ?? ""}
                  placeholder="Chọn lông thủ"
                  options={members.map((member) => ({
                    value: member.id,
                    label: member.name,
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`edit-tx-income-category-${transaction.id}`}>
                  Loại
                </Label>
                <FormSelect
                  id={`edit-tx-income-category-${transaction.id}`}
                  name="category"
                  defaultValue={transaction.category}
                  options={Object.entries(INCOME_CATEGORY_LABELS).map(
                    ([code, label]) => ({ value: code, label }),
                  )}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor={`edit-tx-note-${transaction.id}`}>Ghi chú</Label>
                <Input
                  id={`edit-tx-note-${transaction.id}`}
                  name="note"
                  defaultValue={transaction.note ?? ""}
                />
              </div>
            </>
          )}

          <DialogFooter className="md:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <SubmitButton pendingText="Đang lưu...">Lưu</SubmitButton>
          </DialogFooter>
        </MutationForm>
      </DialogContent>
    </Dialog>
  );
}
