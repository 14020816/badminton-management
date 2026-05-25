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
import {
  createShuttleTypeAction,
  updateShuttleTypeAction,
} from "@/actions/settings";
import {
  DEFAULT_SHUTTLES_PER_BLOCK,
  calcPricePerShuttle,
} from "@/lib/domain/shuttle";
import { defaultShuttleTypeRow, type ShuttleTypeRow } from "@/lib/types/shuttle";
import { formatVND } from "@/lib/format";

export type EditableShuttleType = ShuttleTypeRow & { id: string };

export function ShuttleTypeFormDialog({
  clubId,
  shuttle,
  mode,
  open,
  onOpenChange,
}: {
  clubId: string;
  shuttle: EditableShuttleType | null;
  mode: "add" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!open) return null;

  const defaults = mode === "edit" && shuttle ? shuttle : defaultShuttleTypeRow();
  const perShuttle = calcPricePerShuttle(
    defaults.pricePerBlock,
    defaults.shuttlesPerBlock || DEFAULT_SHUTTLES_PER_BLOCK,
  );

  const action =
    mode === "edit" && shuttle
      ? updateShuttleTypeAction.bind(null, clubId, shuttle.id)
      : createShuttleTypeAction.bind(null, clubId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Sửa loại cầu" : "Thêm loại cầu"}
          </DialogTitle>
        </DialogHeader>
        <MutationForm
          key={mode === "edit" && shuttle ? shuttle.id : "add"}
          action={action}
          successMessage={
            mode === "edit" ? "Đã cập nhật loại cầu" : "Đã thêm loại cầu"
          }
          onSuccess={() => onOpenChange(false)}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="shuttle-name" required>
              Tên loại cầu
            </Label>
            <Input
              id="shuttle-name"
              name="name"
              required
              defaultValue={defaults.name}
              placeholder="VD: Victor Gold, Yonex AS-50"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="shuttle-pricePerBlock" required>
                Giá hộp (VND)
              </Label>
              <Input
                id="shuttle-pricePerBlock"
                name="pricePerBlock"
                type="number"
                min={0}
                required
                defaultValue={defaults.pricePerBlock}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shuttle-shuttlesPerBlock" required>
                Quả / hộp
              </Label>
              <Input
                id="shuttle-shuttlesPerBlock"
                name="shuttlesPerBlock"
                type="number"
                min={1}
                required
                defaultValue={defaults.shuttlesPerBlock}
              />
            </div>
          </div>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            ≈ {formatVND(Math.round(perShuttle))} / quả (theo giá mặc định)
          </p>
          <div className="space-y-2">
            <Label htmlFor="shuttle-inventory" required>
              Tồn kho (quả)
            </Label>
            <Input
              id="shuttle-inventory"
              name="inventory"
              type="number"
              min={0}
              required
              defaultValue={defaults.inventory}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <SubmitButton pendingText="Đang lưu...">
              {mode === "edit" ? "Lưu" : "Thêm"}
            </SubmitButton>
          </DialogFooter>
        </MutationForm>
      </DialogContent>
    </Dialog>
  );
}
