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
import { FormSelect } from "@/components/form/form-select";
import { createMemberAction } from "@/actions/members";
import { MEMBER_RANKS } from "@/lib/domain/member";

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
            <FormSelect
              id="add-member-rank"
              name="rank"
              defaultValue=""
              placeholder="Chưa xếp hạng"
              options={[
                { value: "", label: "Chưa xếp hạng" },
                ...MEMBER_RANKS.map((rank) => ({ value: rank, label: rank })),
              ]}
            />
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
