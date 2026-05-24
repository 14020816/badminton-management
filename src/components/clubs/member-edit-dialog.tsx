"use client";

import type { MemberRank } from "@prisma/client";
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
import { MutationForm } from "@/components/form/mutation-form";
import { updateMemberAction } from "@/actions/members";
import { MEMBER_RANKS } from "@/lib/domain/member";

const selectClassName =
  "flex h-10 w-full rounded-md border border-[var(--color-input)] bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]";

export type EditableMember = {
  id: string;
  name: string;
  rank: MemberRank | null;
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
  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sửa lông thủ</DialogTitle>
        </DialogHeader>
        <MutationForm
          key={member.id}
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
            <select
              id={`edit-member-rank-${member.id}`}
              name="rank"
              defaultValue={member.rank ?? ""}
              className={selectClassName}
            >
              <option value="">Chưa xếp hạng</option>
              {MEMBER_RANKS.map((rank) => (
                <option key={rank} value={rank}>
                  {rank}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit">Lưu</Button>
          </DialogFooter>
        </MutationForm>
      </DialogContent>
    </Dialog>
  );
}
