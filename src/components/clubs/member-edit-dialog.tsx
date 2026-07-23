"use client";

import { useEffect, useState } from "react";
import type { MemberGender, MemberRank } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MutationForm, SubmitButton } from "@/components/form/mutation-form";
import { FormSelect } from "@/components/form/form-select";
import { updateMemberAction } from "@/actions/members";
import { MEMBER_GENDERS, MEMBER_RANKS } from "@/lib/domain/member";
import { cn } from "@/lib/utils";

export type EditableMember = {
  id: string;
  name: string;
  rank: MemberRank | null;
  gender: MemberGender | null;
  deactivatedAt: Date | string | null;
  deactivationReason: string | null;
};

export function MemberEditDialog({
  clubId,
  member,
  open,
  onOpenChange,
}: {
  clubId: string;
  member: EditableMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [deactivated, setDeactivated] = useState(
    () => member?.deactivatedAt != null,
  );

  useEffect(() => {
    if (open && member) {
      setDeactivated(member.deactivatedAt != null);
    }
  }, [open, member?.id, member?.deactivatedAt]);

  if (!member) return null;

  const formKey = `${member.id}-${member.deactivatedAt ?? "active"}`;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setDeactivated(member.deactivatedAt != null);
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sửa lông thủ</DialogTitle>
        </DialogHeader>
        <MutationForm
          key={formKey}
          action={updateMemberAction.bind(null, clubId, member.id)}
          successMessage="Đã cập nhật thành viên"
          onSuccess={() => onOpenChange(false)}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor={`edit-member-name-${member.id}`} required>
              Tên
            </Label>
            <Input
              id={`edit-member-name-${member.id}`}
              name="name"
              required
              defaultValue={member.name}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`edit-member-rank-${member.id}`}>Hạng</Label>
            <FormSelect
              id={`edit-member-rank-${member.id}`}
              name="rank"
              defaultValue={member.rank ?? ""}
              placeholder="Chưa xếp hạng"
              options={[
                { value: "", label: "Chưa xếp hạng" },
                ...MEMBER_RANKS.map((rank) => ({ value: rank, label: rank })),
              ]}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`edit-member-gender-${member.id}`}>Giới tính</Label>
            <FormSelect
              id={`edit-member-gender-${member.id}`}
              name="gender"
              defaultValue={member.gender ?? ""}
              placeholder="Chưa khai báo"
              options={[
                { value: "", label: "Chưa khai báo" },
                ...MEMBER_GENDERS.map((g) => ({
                  value: g,
                  label: g === "MALE" ? "Nam" : "Nữ",
                })),
              ]}
            />
          </div>
          <div className="space-y-3 border-t border-[var(--color-border)] pt-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="deactivated"
                checked={deactivated}
                onChange={(event) => setDeactivated(event.target.checked)}
                className="h-4 w-4 rounded border-[var(--color-input)]"
              />
              Ngưng hoạt động
            </label>
            {deactivated && (
              <div className="space-y-2">
                <Label htmlFor={`edit-member-reason-${member.id}`}>
                  Lý do
                </Label>
                <textarea
                  id={`edit-member-reason-${member.id}`}
                  name="deactivationReason"
                  rows={3}
                  defaultValue={member.deactivationReason ?? ""}
                  placeholder="Lý do (tuỳ chọn)"
                  className={cn(
                    "flex min-h-[5rem] w-full rounded-md border border-[var(--color-input)] bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-[var(--color-muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] disabled:cursor-not-allowed disabled:opacity-50",
                  )}
                />
              </div>
            )}
          </div>
          <DialogFooter>
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
