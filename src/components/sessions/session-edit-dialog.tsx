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
import { MutationForm } from "@/components/form/mutation-form";
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
} from "@/lib/format";

const selectClassName =
  "flex h-10 w-full rounded-md border border-[var(--color-input)] bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]";

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
  const [allocations, setAllocations] = useState<ShareAllocationPayload[]>([]);
  const [guests, setGuests] = useState<GuestAllocationPayload[]>([]);

  useEffect(() => {
    if (!session) return;
    setCourtRental(session.courtRental);
    setShuttlesUsed(session.shuttlesUsed);
    setShuttleTypeId(session.shuttleTypeId ?? shuttleTypes[0]?.id ?? "");
    setAllocations(buildInitialShareAllocations(session.shares));
    setGuests(buildInitialGuestAllocations(session.guests));
  }, [session, shuttleTypes]);

  const shuttlePricing = useMemo(() => {
    const type =
      shuttleTypes.find((option) => option.id === shuttleTypeId) ??
      shuttleTypes[0];
    return {
      pricePerBlock: type?.pricePerBlock ?? 0,
      shuttlesPerBlock: type?.shuttlesPerBlock ?? 12,
    };
  }, [shuttleTypeId, shuttleTypes]);

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
            <select
              id={`edit-courtType-${session.id}`}
              name={isScheduled ? undefined : "courtType"}
              required={!isScheduled}
              disabled={isScheduled}
              defaultValue={session.courtType ?? ""}
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
              <select
                id={`edit-shuttleTypeId-${session.id}`}
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
            <Button
              type="submit"
              disabled={shuttleTypes.length === 0 || allocations.length === 0}
            >
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </MutationForm>
      </DialogContent>
    </Dialog>
  );
}
