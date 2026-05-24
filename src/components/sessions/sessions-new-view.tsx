"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/page-header";
import { MutationForm } from "@/components/form/mutation-form";
import { AddressFields } from "@/components/form/address-fields";
import { SessionMemberSharesEditor } from "@/components/sessions/session-member-shares-editor";
import { createSessionAction } from "@/actions/sessions";
import type {
  GuestAllocationPayload,
  ShareAllocationPayload,
} from "@/lib/domain/sessions";
import { COURT_TYPE_LABELS, COURT_TYPES } from "@/lib/format";

type Member = { id: string; name: string };
type ShuttleTypeOption = {
  id: string;
  name: string;
  pricePerBlock: number;
  shuttlesPerBlock: number;
};

const selectClassName =
  "flex h-10 w-full rounded-md border border-[var(--color-input)] bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]";

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
  const [allocations, setAllocations] = useState<ShareAllocationPayload[]>([]);
  const [guests, setGuests] = useState<GuestAllocationPayload[]>([]);

  const shuttlePricing = useMemo(() => {
    const type =
      shuttleTypes.find((option) => option.id === shuttleTypeId) ??
      shuttleTypes[0];
    return {
      pricePerBlock: type?.pricePerBlock ?? 0,
      shuttlesPerBlock: type?.shuttlesPerBlock ?? 12,
    };
  }, [shuttleTypeId, shuttleTypes]);

  function resetForm() {
    setCourtRental(0);
    setShuttlesUsed(0);
    setShuttleTypeId(shuttleTypes[0]?.id ?? "");
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
              <select
                id="courtType"
                name="courtType"
                required
                defaultValue=""
                className={selectClassName}
              >
                <option value="" disabled>
                  Chọn loại sân
                </option>
                {COURT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {COURT_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
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
                <select
                  id="shuttleTypeId"
                  name="shuttleTypeId"
                  required
                  value={shuttleTypeId}
                  onChange={(event) => setShuttleTypeId(event.target.value)}
                  className={selectClassName}
                >
                  {shuttleTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} ({type.shuttlesPerBlock} quả/hộp)
                    </option>
                  ))}
                </select>
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
              <Button
                type="submit"
                disabled={shuttleTypes.length === 0 || allocations.length === 0}
              >
                Lưu buổi đánh
              </Button>
            </div>
          </MutationForm>
        </CardContent>
      </Card>
    </div>
  );
}
