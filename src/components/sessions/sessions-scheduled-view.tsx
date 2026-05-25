"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { CourtType } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/page-header";
import { MutationForm, SubmitButton } from "@/components/form/mutation-form";
import { FormSelect } from "@/components/form/form-select";
import { AddressDisplay } from "@/components/form/address-fields";
import { SessionMemberSharesEditor } from "@/components/sessions/session-member-shares-editor";
import { ScheduleDatePicker } from "@/components/sessions/schedule-date-picker";
import { createSessionAction } from "@/actions/sessions";
import type {
  GuestAllocationPayload,
  ShareAllocationPayload,
} from "@/lib/domain/sessions";
import {
  formatScheduleLabel,
  formatScheduleTimeRange,
  formatWeekdays,
} from "@/lib/domain/schedule";
import { formatCourtType, formatVND } from "@/lib/format";

type Member = { id: string; name: string };
type ShuttleTypeOption = {
  id: string;
  name: string;
  pricePerBlock: number;
  shuttlesPerBlock: number;
};
type ScheduleOption = {
  id: string;
  startTime: string;
  endTime: string;
  weekdays: number[];
  courtType: CourtType;
  courtRental: number;
  address: string | null;
  googleAddressUrl: string | null;
};
type FulfilledSession = {
  scheduleId: string;
  date: string;
};

export function SessionsScheduledView({
  clubId,
  schedules,
  fulfilled,
  members,
  shuttleTypes,
}: {
  clubId: string;
  schedules: ScheduleOption[];
  fulfilled: FulfilledSession[];
  members: Member[];
  shuttleTypes: ShuttleTypeOption[];
}) {
  const router = useRouter();
  const [scheduleId, setScheduleId] = useState(schedules[0]?.id ?? "");
  const [date, setDate] = useState("");
  const [courtRental, setCourtRental] = useState(
    schedules[0]?.courtRental ?? 0,
  );
  const [shuttlesUsed, setShuttlesUsed] = useState(0);
  const [shuttleTypeId, setShuttleTypeId] = useState(shuttleTypes[0]?.id ?? "");
  const [shuttlePricePerBlock, setShuttlePricePerBlock] = useState(
    shuttleTypes[0]?.pricePerBlock ?? 0,
  );
  const [allocations, setAllocations] = useState<ShareAllocationPayload[]>([]);
  const [guests, setGuests] = useState<GuestAllocationPayload[]>([]);

  const selectedSchedule = useMemo(
    () => schedules.find((schedule) => schedule.id === scheduleId) ?? null,
    [schedules, scheduleId],
  );

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
    if (selectedSchedule) {
      setCourtRental(selectedSchedule.courtRental);
      setDate("");
    }
  }, [selectedSchedule]);

  useEffect(() => {
    if (selectedShuttleType) {
      setShuttlePricePerBlock(selectedShuttleType.pricePerBlock);
    }
  }, [selectedShuttleType]);

  if (schedules.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Thêm lịch cố định"
          description="Ghi nhận buổi đánh từ lịch hàng tuần"
        />
        <Card>
          <CardContent className="py-8 text-sm text-[var(--muted)]">
            Chưa có lịch cố định.{" "}
            <Link
              href={`/g/${clubId}/settings/schedule`}
              className="font-medium text-[var(--primary)] hover:underline"
            >
              Tạo lịch trong Cài đặt
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thêm lịch cố định"
        description="Chọn lịch và ngày, rồi ghi nhận buổi đánh"
      />

      <Card>
        <CardHeader>
          <CardTitle>Ghi nhận buổi đánh</CardTitle>
        </CardHeader>
        <CardContent>
          {shuttleTypes.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              Chưa có loại cầu — vào Cài đặt để thêm trước khi ghi buổi đánh.
            </p>
          ) : (
            <MutationForm
              action={createSessionAction.bind(null, clubId)}
              successMessage="Đã ghi nhận buổi đánh"
              className="space-y-4"
              onSuccess={() => {
                setAllocations([]);
                setGuests([]);
                router.refresh();
              }}
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="scheduleId" required>
                    Lịch đánh
                  </Label>
                  <FormSelect
                    id="scheduleId"
                    name="scheduleId"
                    required
                    value={scheduleId}
                    onValueChange={setScheduleId}
                    options={schedules.map((schedule) => ({
                      value: schedule.id,
                      label: formatScheduleLabel(schedule),
                    }))}
                  />
                </div>
                {selectedSchedule && (
                  <ScheduleDatePicker
                    schedule={selectedSchedule}
                    fulfilled={fulfilled}
                    value={date}
                    onChange={setDate}
                  />
                )}
              </div>

              {selectedSchedule && (
                <div className="space-y-1 text-sm text-[var(--muted)]">
                  <p>
                    {formatCourtType(selectedSchedule.courtType)} ·{" "}
                    {formatScheduleTimeRange(
                      selectedSchedule.startTime,
                      selectedSchedule.endTime,
                    )}{" "}
                    · {formatWeekdays(selectedSchedule.weekdays)}
                  </p>
                  {(selectedSchedule.address || selectedSchedule.googleAddressUrl) && (
                    <AddressDisplay
                      address={selectedSchedule.address}
                      googleAddressUrl={selectedSchedule.googleAddressUrl}
                    />
                  )}
                </div>
              )}

              {selectedSchedule && (
                <>
                  <input
                    type="hidden"
                    name="courtType"
                    value={selectedSchedule.courtType}
                  />
                  <input
                    type="hidden"
                    name="note"
                    value={`Buổi ${formatScheduleTimeRange(selectedSchedule.startTime, selectedSchedule.endTime)}`}
                  />
                </>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="scheduled-courtRental" required>
                    Thuê sân
                  </Label>
                  <Input
                    id="scheduled-courtRental"
                    name="courtRental"
                    type="number"
                    min={0}
                    required
                    value={courtRental}
                    onChange={(event) =>
                      setCourtRental(Number(event.target.value))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduled-shuttlesUsed" required>
                    Số cầu dùng
                  </Label>
                  <Input
                    id="scheduled-shuttlesUsed"
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
                <div className="space-y-2">
                  <Label htmlFor="scheduled-shuttleTypeId" required>
                    Loại cầu
                  </Label>
                  <FormSelect
                    id="scheduled-shuttleTypeId"
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
                <div className="space-y-2">
                  <Label htmlFor="scheduled-shuttlePricePerBlock" required>
                    Giá cầu (một hộp)
                  </Label>
                  <Input
                    id="scheduled-shuttlePricePerBlock"
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
              </div>

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

              <SubmitButton
                pendingText="Đang lưu..."
                disabled={allocations.length === 0 || !scheduleId || !date}
              >
                Ghi nhận buổi đánh
              </SubmitButton>
            </MutationForm>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
