"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CourtType } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/page-header";
import { MutationForm, SubmitButton } from "@/components/form/mutation-form";
import { FormSelect } from "@/components/form/form-select";
import { AddressFields } from "@/components/form/address-fields";
import {
  SessionMemberSharesEditor,
  buildInitialGuestAllocations,
  buildInitialShareAllocations,
} from "@/components/sessions/session-member-shares-editor";
import { ScheduleDatePicker } from "@/components/sessions/schedule-date-picker";
import type { EditableSession } from "@/components/sessions/session-form-types";
import { createSessionAction, updateSessionAction } from "@/actions/sessions";
import type {
  GuestAllocationPayload,
  ShareAllocationPayload,
} from "@/lib/domain/sessions";
import {
  formatScheduleTimeRange,
  formatWeekdays,
} from "@/lib/domain/schedule";
import {
  COURT_TYPE_LABELS,
  COURT_TYPES,
  formatDate,
  formatDateInput,
  formatCourtType,
  formatVND,
} from "@/lib/format";

type ScheduleInfo = {
  id: string;
  weekdays: number[];
  startTime: string;
  endTime: string;
};

type FulfilledSession = {
  scheduleId: string;
  date: string | Date;
};

type Member = { id: string; name: string };
type ShuttleTypeOption = {
  id: string;
  name: string;
  pricePerBlock: number;
  shuttlesPerBlock: number;
};

function resolveShuttlePricePerBlock(
  session: EditableSession | undefined,
  shuttleTypeId: string,
  shuttleTypes: ShuttleTypeOption[],
) {
  return (
    session?.shuttlePricePerBlock ??
    shuttleTypes.find((type) => type.id === shuttleTypeId)?.pricePerBlock ??
    shuttleTypes[0]?.pricePerBlock ??
    0
  );
}

function createInitialFormState(
  shuttleTypes: ShuttleTypeOption[],
  session?: EditableSession,
) {
  const shuttleTypeId = session?.shuttleTypeId ?? shuttleTypes[0]?.id ?? "";

  return {
    courtRental: session?.courtRental ?? 0,
    shuttlesUsed: session?.shuttlesUsed ?? 0,
    shuttleTypeId,
    shuttlePricePerBlock: resolveShuttlePricePerBlock(
      session,
      shuttleTypeId,
      shuttleTypes,
    ),
    date: session ? formatDateInput(session.date) : "",
    note: session?.note ?? "",
    courtType: (session?.courtType ?? "") as CourtType | "",
    address: session?.address ?? "",
    googleAddressUrl: session?.googleAddressUrl ?? "",
    allocations: session
      ? buildInitialShareAllocations(session.shares)
      : ([] as ShareAllocationPayload[]),
    guests: session
      ? buildInitialGuestAllocations(session.guests)
      : ([] as GuestAllocationPayload[]),
  };
}

export function SessionFormView({
  clubId,
  members,
  shuttleTypes,
  mode,
  session,
  cancelHref,
  schedule,
  fulfilled = [],
}: {
  clubId: string;
  members: Member[];
  shuttleTypes: ShuttleTypeOption[];
  mode: "create" | "edit";
  session?: EditableSession;
  cancelHref?: string;
  schedule?: ScheduleInfo | null;
  fulfilled?: FulfilledSession[];
}) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const [initialState] = useState(() =>
    createInitialFormState(shuttleTypes, session),
  );

  const [courtRental, setCourtRental] = useState(initialState.courtRental);
  const [shuttlesUsed, setShuttlesUsed] = useState(initialState.shuttlesUsed);
  const [shuttleTypeId, setShuttleTypeId] = useState(initialState.shuttleTypeId);
  const [shuttlePricePerBlock, setShuttlePricePerBlock] = useState(
    initialState.shuttlePricePerBlock,
  );
  const [date, setDate] = useState(initialState.date);
  const [note, setNote] = useState(initialState.note);
  const [courtType, setCourtType] = useState<CourtType | "">(
    initialState.courtType,
  );
  const [address, setAddress] = useState(initialState.address);
  const [googleAddressUrl, setGoogleAddressUrl] = useState(
    initialState.googleAddressUrl,
  );
  const [allocations, setAllocations] = useState(initialState.allocations);
  const [guests, setGuests] = useState(initialState.guests);

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
    if (isEdit || !selectedShuttleType) return;
    setShuttlePricePerBlock(selectedShuttleType.pricePerBlock);
  }, [isEdit, selectedShuttleType]);

  function handleShuttleTypeChange(nextShuttleTypeId: string) {
    setShuttleTypeId(nextShuttleTypeId);

    if (isEdit && nextShuttleTypeId === session?.shuttleTypeId) {
      setShuttlePricePerBlock(
        resolveShuttlePricePerBlock(session, nextShuttleTypeId, shuttleTypes),
      );
      return;
    }

    const nextShuttleType = shuttleTypes.find(
      (type) => type.id === nextShuttleTypeId,
    );
    if (nextShuttleType) {
      setShuttlePricePerBlock(nextShuttleType.pricePerBlock);
    }
  }

  function resetForm() {
    const next = createInitialFormState(shuttleTypes);
    setCourtRental(next.courtRental);
    setShuttlesUsed(next.shuttlesUsed);
    setShuttleTypeId(next.shuttleTypeId);
    setShuttlePricePerBlock(next.shuttlePricePerBlock);
    setDate(next.date);
    setNote(next.note);
    setCourtType(next.courtType);
    setAddress(next.address);
    setGoogleAddressUrl(next.googleAddressUrl);
    setAllocations(next.allocations);
    setGuests(next.guests);
  }

  const isScheduled = Boolean(session?.scheduleId);
  const formAction = isEdit
    ? updateSessionAction.bind(null, clubId, session!.id)
    : createSessionAction.bind(null, clubId);

  return (
    <div className="space-y-6">
      {isEdit && cancelHref && (
        <Link
          href={cancelHref}
          className="text-sm text-[var(--color-muted-foreground)] hover:text-[var(--primary)]"
        >
          ← Quay lại chi tiết
        </Link>
      )}

      <PageHeader
        title={isEdit ? "Sửa buổi đánh" : "Thêm buổi đánh thủ công"}
        description={
          isEdit
            ? `Buổi đánh ngày ${formatDate(session!.date)}${
                isScheduled ? " · theo lịch cố định" : ""
              }`
            : "Ghi nhận buổi đánh không theo lịch cố định"
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Thông tin buổi đánh</CardTitle>
        </CardHeader>
        <CardContent>
          <MutationForm
            key={isEdit ? session!.id : "create"}
            action={formAction}
            successMessage={
              isEdit ? "Đã cập nhật buổi đánh" : "Đã thêm buổi đánh"
            }
            className="grid gap-4 md:grid-cols-2"
            onSuccess={() => {
              if (isEdit) {
                router.push(cancelHref ?? `/g/${clubId}/sessions/${session!.id}`);
                router.refresh();
                return;
              }
              resetForm();
            }}
          >
            {isScheduled && schedule ? (
              <>
                <ScheduleDatePicker
                  schedule={schedule}
                  fulfilled={fulfilled}
                  value={date}
                  onChange={setDate}
                />
                <div className="space-y-1 text-sm text-[var(--color-muted-foreground)] md:col-span-2">
                  <p>
                    {courtType ? formatCourtType(courtType) : ""} ·{" "}
                    {formatScheduleTimeRange(
                      schedule.startTime,
                      schedule.endTime,
                    )}{" "}
                    · {formatWeekdays(schedule.weekdays)}
                  </p>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="date" required>
                  Ngày
                </Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  required
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="courtType" required>
                Loại sân
              </Label>
              {isScheduled && courtType && (
                <input type="hidden" name="courtType" value={courtType} />
              )}
              <FormSelect
                id="courtType"
                name={isScheduled ? undefined : "courtType"}
                required={!isScheduled}
                disabled={isScheduled}
                value={courtType}
                onValueChange={(value) => setCourtType(value as CourtType)}
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
              <Label htmlFor="courtRental" required>
                Thuê sân
              </Label>
              <CurrencyInput
                id="courtRental"
                name="courtRental"
                required
                value={courtRental}
                onValueChange={setCourtRental}
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
                  onValueChange={handleShuttleTypeChange}
                  options={shuttleTypes.map((type) => ({
                    value: type.id,
                    label: `${type.name} (${type.shuttlesPerBlock} quả/hộp)`,
                  }))}
                />
              </div>
            ) : (
              <p className="text-sm text-[var(--color-muted-foreground)] md:col-span-2">
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
                onChange={(event) =>
                  setShuttlesUsed(Number(event.target.value) || 0)
                }
              />
            </div>
            {shuttleTypes.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="shuttlePricePerBlock" required>
                  Giá cầu (một hộp)
                </Label>
                <CurrencyInput
                  id="shuttlePricePerBlock"
                  name="shuttlePricePerBlock"
                  required
                  value={shuttlePricePerBlock}
                  onValueChange={setShuttlePricePerBlock}
                />
                {selectedShuttleType && (
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    Mặc định từ loại cầu:{" "}
                    {formatVND(selectedShuttleType.pricePerBlock)}
                  </p>
                )}
              </div>
            )}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="note">Ghi chú</Label>
              <Input
                id="note"
                name="note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>
            {isEdit ? (
              <>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">Địa chỉ</Label>
                  <Input
                    id="address"
                    name="address"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    placeholder="VD: Sân cầu lông ABC, Quận 1"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="googleAddressUrl">Link Google Maps</Label>
                  <Input
                    id="googleAddressUrl"
                    name="googleAddressUrl"
                    type="url"
                    value={googleAddressUrl}
                    onChange={(event) =>
                      setGoogleAddressUrl(event.target.value)
                    }
                    placeholder="https://maps.google.com/..."
                  />
                </div>
              </>
            ) : (
              <AddressFields />
            )}
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
            <div className="flex flex-wrap gap-2 md:col-span-2">
              <SubmitButton
                pendingText="Đang lưu..."
                disabled={shuttleTypes.length === 0 || allocations.length === 0}
              >
                {isEdit ? "Lưu thay đổi" : "Lưu buổi đánh"}
              </SubmitButton>
              {isEdit && cancelHref && (
                <Button asChild type="button" variant="outline">
                  <Link href={cancelHref}>Hủy</Link>
                </Button>
              )}
            </div>
          </MutationForm>
        </CardContent>
      </Card>
    </div>
  );
}
