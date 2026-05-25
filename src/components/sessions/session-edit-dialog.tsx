"use client";

import { useEffect, useMemo, useState } from "react";
import type { CourtType } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MutationForm, SubmitButton } from "@/components/form/mutation-form";
import { FormSelect } from "@/components/form/form-select";
import { AddressFields } from "@/components/form/address-fields";
import {
  SessionMemberSharesEditor,
  buildInitialGuestAllocations,
  buildInitialShareAllocations,
} from "@/components/sessions/session-member-shares-editor";
import { updateSessionAction } from "@/actions/sessions";
import type {
  GuestAllocationPayload,
  ShareAllocationPayload,
} from "@/lib/domain/sessions";
import {
  COURT_TYPE_LABELS,
  COURT_TYPES,
  formatDate,
  formatDateInput,
  formatVND,
} from "@/lib/format";

type Member = { id: string; name: string };
type ShuttleTypeOption = {
  id: string;
  name: string;
  pricePerBlock: number;
  shuttlesPerBlock: number;
};

export type EditableSession = {
  id: string;
  date: Date;
  courtType: CourtType | null;
  courtRental: number;
  shuttlesUsed: number;
  shuttleTypeId: string | null;
  shuttlePricePerBlock: number | null;
  scheduleId: string | null;
  address: string | null;
  googleAddressUrl: string | null;
  note: string | null;
  shares: {
    memberId: string;
    amount: number;
    water?: number;
    parking?: number;
    extra?: number;
    extraNote?: string | null;
    memberPaysForGuests?: boolean;
    paysShuttleCost?: boolean;
  }[];
  guests: {
    id: string;
    name: string;
    amount: number;
    water?: number;
    parking?: number;
    extra?: number;
    extraNote?: string | null;
    hostedByMemberId?: string | null;
  }[];
};

export function SessionEditDialog({
  clubId,
  session,
  members,
  shuttleTypes,
  open,
  onOpenChange,
}: {
  clubId: string;
  session: EditableSession | null;
  members: Member[];
  shuttleTypes: ShuttleTypeOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [courtRental, setCourtRental] = useState(0);
  const [shuttlesUsed, setShuttlesUsed] = useState(0);
  const [shuttleTypeId, setShuttleTypeId] = useState("");
  const [shuttlePricePerBlock, setShuttlePricePerBlock] = useState(0);
  const [allocations, setAllocations] = useState<ShareAllocationPayload[]>([]);
  const [guests, setGuests] = useState<GuestAllocationPayload[]>([]);

  useEffect(() => {
    if (!session) return;
    setCourtRental(session.courtRental);
    setShuttlesUsed(session.shuttlesUsed);
    setShuttleTypeId(session.shuttleTypeId ?? shuttleTypes[0]?.id ?? "");
    setShuttlePricePerBlock(
      session.shuttlePricePerBlock ??
        shuttleTypes.find((type) => type.id === session.shuttleTypeId)
          ?.pricePerBlock ??
        shuttleTypes[0]?.pricePerBlock ??
        0,
    );
    setAllocations(buildInitialShareAllocations(session.shares));
    setGuests(buildInitialGuestAllocations(session.guests));
  }, [session, shuttleTypes]);

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
    if (!session || !selectedShuttleType) return;
    if (session.shuttleTypeId === shuttleTypeId && session.shuttlePricePerBlock) {
      return;
    }
    setShuttlePricePerBlock(selectedShuttleType.pricePerBlock);
  }, [selectedShuttleType, session, shuttleTypeId]);

  if (!session) return null;

  const isScheduled = Boolean(session.scheduleId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sửa buổi đánh</DialogTitle>
          <DialogDescription>
            Buổi đánh ngày {formatDate(session.date)}
            {isScheduled ? " · theo lịch cố định" : ""}
          </DialogDescription>
        </DialogHeader>

        <MutationForm
          key={session.id}
          action={updateSessionAction.bind(null, clubId, session.id)}
          successMessage="Đã cập nhật buổi đánh"
          onSuccess={() => onOpenChange(false)}
          className="grid gap-4 md:grid-cols-2"
        >
          <div className="space-y-2">
            <Label htmlFor={`edit-date-${session.id}`} required>
              Ngày
            </Label>
            <Input
              id={`edit-date-${session.id}`}
              name="date"
              type="date"
              required
              defaultValue={formatDateInput(session.date)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`edit-courtType-${session.id}`} required>
              Loại sân
            </Label>
            {isScheduled && session.courtType && (
              <input type="hidden" name="courtType" value={session.courtType} />
            )}
            <FormSelect
              id={`edit-courtType-${session.id}`}
              name={isScheduled ? undefined : "courtType"}
              required={!isScheduled}
              disabled={isScheduled}
              defaultValue={session.courtType ?? ""}
              placeholder="Chọn loại sân"
              options={COURT_TYPES.map((type) => ({
                value: type,
                label: COURT_TYPE_LABELS[type],
              }))}
            />
            {isScheduled && (
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Loại sân theo lịch cố định
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor={`edit-courtRental-${session.id}`} required>
              Thuê sân
            </Label>
            <Input
              id={`edit-courtRental-${session.id}`}
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
              <Label htmlFor={`edit-shuttleTypeId-${session.id}`} required>
                Loại cầu
              </Label>
              <FormSelect
                id={`edit-shuttleTypeId-${session.id}`}
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
            <p className="text-sm text-[var(--color-muted-foreground)] md:col-span-2">
              Chưa có loại cầu — vào Cài đặt để thêm.
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor={`edit-shuttlesUsed-${session.id}`} required>
              Số cầu dùng
            </Label>
            <Input
              id={`edit-shuttlesUsed-${session.id}`}
              name="shuttlesUsed"
              type="number"
              min={0}
              required
              value={shuttlesUsed}
              onChange={(event) => setShuttlesUsed(Number(event.target.value) || 0)}
            />
          </div>
          {shuttleTypes.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor={`edit-shuttlePricePerBlock-${session.id}`} required>
                Giá cầu (một hộp)
              </Label>
              <Input
                id={`edit-shuttlePricePerBlock-${session.id}`}
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
          )}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor={`edit-note-${session.id}`}>Ghi chú</Label>
            <Input
              id={`edit-note-${session.id}`}
              name="note"
              defaultValue={session.note ?? ""}
            />
          </div>
          <AddressFields
            idPrefix={`edit-${session.id}-`}
            defaultAddress={session.address ?? ""}
            defaultGoogleAddressUrl={session.googleAddressUrl ?? ""}
          />
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
          <DialogFooter className="md:col-span-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <SubmitButton
              pendingText="Đang lưu..."
              disabled={shuttleTypes.length === 0 || allocations.length === 0}
            >
              Lưu thay đổi
            </SubmitButton>
          </DialogFooter>
        </MutationForm>
      </DialogContent>
    </Dialog>
  );
}
