"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { CourtType } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/page-header";
import { MutationForm } from "@/components/form/mutation-form";
import { AddressDisplay } from "@/components/form/address-fields";
import { SessionMemberSharesEditor } from "@/components/sessions/session-member-shares-editor";
import { createSessionAction } from "@/actions/sessions";
import type {
  GuestAllocationPayload,
  ShareAllocationPayload,
} from "@/lib/domain/sessions";
import {
  formatScheduleLabel,
  formatScheduleTimeRange,
  formatWeekdays,
  getScheduleDateOptions,
} from "@/lib/domain/schedule";
import { formatCourtType } from "@/lib/format";

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

const selectClassName =
  "flex h-10 w-full rounded-md border border-[var(--color-input)] bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]";

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
  const [allocations, setAllocations] = useState<ShareAllocationPayload[]>([]);
  const [guests, setGuests] = useState<GuestAllocationPayload[]>([]);

  const selectedSchedule = useMemo(
    () => schedules.find((schedule) => schedule.id === scheduleId) ?? null,
    [schedules, scheduleId],
  );

  const dateOptions = useMemo(() => {
    if (!selectedSchedule) return [];
    return getScheduleDateOptions(selectedSchedule, fulfilled, {
      futureCount: 5,
    });
  }, [selectedSchedule, fulfilled]);

  const pastDates = dateOptions.filter((option) => option.isPast);
  const futureDates = dateOptions.filter((option) => !option.isPast);

  const shuttlePricing = useMemo(() => {
    const type =
      shuttleTypes.find((option) => option.id === shuttleTypeId) ??
      shuttleTypes[0];
    return {
      pricePerBlock: type?.pricePerBlock ?? 0,
      shuttlesPerBlock: type?.shuttlesPerBlock ?? 12,
    };
  }, [shuttleTypeId, shuttleTypes]);

  useEffect(() => {
    if (selectedSchedule) {
      setCourtRental(selectedSchedule.courtRental);
    }
  }, [selectedSchedule]);

  useEffect(() => {
    if (dateOptions.length === 0) {
      setDate("");
      return;
    }
    if (!dateOptions.some((option) => option.value === date)) {
      setDate(dateOptions[0]?.value ?? "");
    }
  }, [dateOptions, date]);

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
                router.refresh();
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="scheduleId" required>
                    Lịch đánh
                  </Label>
                  <select
                    id="scheduleId"
                    name="scheduleId"
                    required
                    value={scheduleId}
                    onChange={(e) => setScheduleId(e.target.value)}
                    className={selectClassName}
                  >
                    {schedules.map((schedule) => (
                      <option key={schedule.id} value={schedule.id}>
                        {formatScheduleLabel(schedule)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduled-date" required>
                    Ngày
                  </Label>
                  <select
                    id="scheduled-date"
                    name="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    disabled={dateOptions.length === 0}
                    className={selectClassName}
                  >
                    {dateOptions.length === 0 ? (
                      <option value="">Không còn ngày cần ghi</option>
                    ) : (
                      <>
                        {pastDates.length > 0 && (
                          <optgroup label="Chưa ghi (quá khứ)">
                            {pastDates.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {futureDates.length > 0 && (
                          <optgroup label="Sắp tới">
                            {futureDates.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </>
                    )}
                  </select>
                </div>
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
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="scheduled-shuttleTypeId" required>
                    Loại cầu
                  </Label>
                  <select
                    id="scheduled-shuttleTypeId"
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

              <Button
                type="submit"
                disabled={allocations.length === 0 || !scheduleId || !date}
              >
                Ghi nhận buổi đánh
              </Button>
            </MutationForm>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
