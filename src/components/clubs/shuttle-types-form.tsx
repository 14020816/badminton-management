"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MutationForm, SubmitButton } from "@/components/form/mutation-form";
import { updateClubSettingsAction } from "@/actions/settings";
import {
  DEFAULT_SHUTTLES_PER_BLOCK,
  calcPricePerShuttle,
} from "@/lib/domain/shuttle";
import { defaultShuttleTypeRow, type ShuttleTypeRow } from "@/lib/types/shuttle";
import { formatVND } from "@/lib/format";

export function ShuttleTypesForm({
  clubId,
  initialTypes,
}: {
  clubId: string;
  initialTypes: ShuttleTypeRow[];
}) {
  const [types, setTypes] = useState<ShuttleTypeRow[]>(
    initialTypes.length > 0 ? initialTypes : [defaultShuttleTypeRow()],
  );

  function updateRow(index: number, patch: Partial<ShuttleTypeRow>) {
    setTypes((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  }

  function addRow() {
    setTypes((prev) => [...prev, defaultShuttleTypeRow()]);
  }

  function removeRow(index: number) {
    setTypes((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  return (
    <MutationForm
      action={updateClubSettingsAction.bind(null, clubId)}
      successMessage="Đã lưu cài đặt"
      className="space-y-4"
    >
      <input type="hidden" name="shuttleTypes" value={JSON.stringify(types)} />

      <div className="space-y-4">
        {types.map((row, index) => {
          const perShuttle = calcPricePerShuttle(
            row.pricePerBlock,
            row.shuttlesPerBlock || DEFAULT_SHUTTLES_PER_BLOCK,
          );
          return (
            <div
              key={row.id ?? `new-${index}`}
              className="space-y-3 rounded-lg border border-[var(--color-border)] p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Loại cầu #{index + 1}</p>
                {types.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRow(index)}
                    className="text-[var(--trading-down)]"
                  >
                    <Trash2 className="h-4 w-4" />
                    Xóa
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label required>Tên loại cầu</Label>
                <Input
                  value={row.name}
                  onChange={(e) => updateRow(index, { name: e.target.value })}
                  placeholder="VD: Victor Gold, Yonex AS-50"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label required>Giá hộp (VND)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={row.pricePerBlock}
                    onChange={(e) =>
                      updateRow(index, { pricePerBlock: Number(e.target.value) })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label required>Quả / hộp</Label>
                  <Input
                    type="number"
                    min={1}
                    value={row.shuttlesPerBlock}
                    onChange={(e) =>
                      updateRow(index, {
                        shuttlesPerBlock: Number(e.target.value) || DEFAULT_SHUTTLES_PER_BLOCK,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <p className="text-xs text-[var(--muted)]">
                ≈ {formatVND(Math.round(perShuttle))} / quả
              </p>

              <div className="space-y-2">
                <Label required>Tồn kho (quả)</Label>
                <Input
                  type="number"
                  min={0}
                  value={row.inventory}
                  onChange={(e) =>
                    updateRow(index, { inventory: Number(e.target.value) })
                  }
                  required
                />
              </div>
            </div>
          );
        })}
      </div>

      <Button type="button" variant="outline" onClick={addRow} className="w-full sm:w-auto">
        <Plus className="h-4 w-4" />
        Thêm loại cầu
      </Button>

      <SubmitButton pendingText="Đang lưu...">Lưu cài đặt</SubmitButton>
    </MutationForm>
  );
}
