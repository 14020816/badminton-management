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
import { Label } from "@/components/ui/label";
import { MutationForm, SubmitButton } from "@/components/form/mutation-form";
import { createMemberAction } from "@/actions/members";
import { MEMBER_RANKS } from "@/lib/domain/member";

const selectClassName =
  "flex h-10 w-full rounded-md border border-[var(--color-input)] bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]";

export function MemberAddDialog({
  clubId,
  open,
  onOpenChange,
}: {
  clubId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm lông thủ</DialogTitle>
        </DialogHeader>
        <MutationForm
          action={createMemberAction.bind(null, clubId)}
          successMessage="Đã thêm thành viên"
          onSuccess={() => onOpenChange(false)}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="add-member-name" required>
              Tên
            </Label>
            <Input
              id="add-member-name"
              name="name"
              required
              placeholder="VD: Nguyễn Văn A"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-member-rank">Hạng</Label>
            <select id="add-member-rank" name="rank" defaultValue="" className={selectClassName}>
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
            <SubmitButton pendingText="Đang thêm...">Thêm</SubmitButton>
          </DialogFooter>
        </MutationForm>
      </DialogContent>
    </Dialog>
  );
}
