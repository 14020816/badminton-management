"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/page-header";
import { MutationForm, SubmitButton } from "@/components/form/mutation-form";
import { FormSelect } from "@/components/form/form-select";
import { AddressFields } from "@/components/form/address-fields";
import { SessionMemberSharesEditor } from "@/components/sessions/session-member-shares-editor";
import { createSessionAction } from "@/actions/sessions";
import type {
  GuestAllocationPayload,
  ShareAllocationPayload,
} from "@/lib/domain/sessions";
import { COURT_TYPE_LABELS, COURT_TYPES, formatVND } from "@/lib/format";

type Member = { id: string; name: string };
type ShuttleTypeOption = {
  id: string;
  name: string;
  pricePerBlock: number;
  shuttlesPerBlock: number;
};

export function SessionsNewView({
  clubId,
  members,
  shuttleTypes,
}: {
  clubId: string;
  members: Member[];
  shuttleTypes: ShuttleTypeOption[];
}) {
  const [courtRental, setCourtRental] = useState(0);
  const [shuttlesUsed, setShuttlesUsed] = useState(0);
  const [shuttleTypeId, setShuttleTypeId] = useState(shuttleTypes[0]?.id ?? "");
  const [shuttlePricePerBlock, setShuttlePricePerBlock] = useState(
    shuttleTypes[0]?.pricePerBlock ?? 0,
  );
  const [allocations, setAllocations] = useState<ShareAllocationPayload[]>([]);
  const [guests, setGuests] = useState<GuestAllocationPayload[]>([]);

  const selectedShuttleType = useMemo(
    () =>
      shuttleTypes.find((option) => option.id === shuttleTypeId) ??
      shuttleTypes[0] ??
      null,
    [shuttleTypeId, shuttleTypes],
  );

  const shuttlePricing = useMemo(
    () => ({
      pricePerBlock: shuttlePricePerBlock,
      shuttlesPerBlock: selectedShuttleType?.shuttlesPerBlock ?? 12,
    }),
    [selectedShuttleType, shuttlePricePerBlock],
  );

  useEffect(() => {
    if (selectedShuttleType) {
      setShuttlePricePerBlock(selectedShuttleType.pricePerBlock);
    }
  }, [selectedShuttleType]);

  function resetForm() {
    setCourtRental(0);
    setShuttlesUsed(0);
    setShuttleTypeId(shuttleTypes[0]?.id ?? "");
    setShuttlePricePerBlock(shuttleTypes[0]?.pricePerBlock ?? 0);
    setAllocations([]);
    setGuests([]);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thêm buổi đánh thủ công"
        description="Ghi nhận buổi đánh không theo lịch cố định"
      />

      <Card>
        <CardHeader>
          <CardTitle>Thông tin buổi đánh</CardTitle>
        </CardHeader>
        <CardContent>
          <MutationForm
            action={createSessionAction.bind(null, clubId)}
            successMessage="Đã thêm buổi đánh"
            className="grid gap-4 md:grid-cols-2"
            onSuccess={resetForm}
          >
            <div className="space-y-2">
              <Label htmlFor="date" required>
                Ngày
              </Label>
              <Input id="date" name="date" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="courtType" required>
                Loại sân
              </Label>
              <FormSelect
                id="courtType"
                name="courtType"
                required
                placeholder="Chọn loại sân"
                options={COURT_TYPES.map((type) => ({
                  value: type,
                  label: COURT_TYPE_LABELS[type],
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="courtRental" required>
                Thuê sân
              </Label>
              <Input
                id="courtRental"
                name="courtRental"
                type="number"
                min={0}
                required
                value={courtRental}
                onChange={(event) => setCourtRental(Number(event.target.value) || 0)}
              />
            </div>
            {shuttleTypes.length > 0 ? (
              <div className="space-y-2">
                <Label htmlFor="shuttleTypeId" required>
                  Loại cầu
                </Label>
                <FormSelect
                  id="shuttleTypeId"
                  name="shuttleTypeId"
                  required
                  value={shuttleTypeId}
                  onValueChange={setShuttleTypeId}
                  options={shuttleTypes.map((type) => ({
                    value: type.id,
                    label: `${type.name} (${type.shuttlesPerBlock} quả/hộp)`,
                  }))}
                />
              </div>
            ) : (
              <p className="text-sm text-[var(--muted)] md:col-span-2">
                Chưa có loại cầu — vào Cài đặt để thêm trước khi ghi buổi đánh.
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="shuttlesUsed" required>
                Số cầu dùng
              </Label>
              <Input
                id="shuttlesUsed"
                name="shuttlesUsed"
                type="number"
                min={0}
                required
                value={shuttlesUsed}
                onChange={(event) => setShuttlesUsed(Number(event.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shuttlePricePerBlock" required>
                Giá cầu (một hộp)
              </Label>
              <Input
                id="shuttlePricePerBlock"
                name="shuttlePricePerBlock"
                type="number"
                min={0}
                required
                value={shuttlePricePerBlock}
                onChange={(event) =>
                  setShuttlePricePerBlock(Number(event.target.value) || 0)
                }
              />
              {selectedShuttleType && (
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  Mặc định từ loại cầu: {formatVND(selectedShuttleType.pricePerBlock)}
                </p>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="note">Ghi chú</Label>
              <Input id="note" name="note" />
            </div>
            <AddressFields />
            <div className="md:col-span-2">
              <SessionMemberSharesEditor
                members={members}
                courtRental={courtRental}
                shuttlesUsed={shuttlesUsed}
                shuttlePricing={shuttlePricing}
                allocations={allocations}
                onChange={setAllocations}
                guests={guests}
                onGuestsChange={setGuests}
              />
            </div>
            <div className="md:col-span-2">
              <SubmitButton
                pendingText="Đang lưu..."
                disabled={shuttleTypes.length === 0 || allocations.length === 0}
              >
                Lưu buổi đánh
              </SubmitButton>
            </div>
          </MutationForm>
        </CardContent>
      </Card>
    </div>
  );
}
