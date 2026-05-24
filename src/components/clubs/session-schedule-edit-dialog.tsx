"use client";

import { useEffect, useState } from "react";
import type { CourtType } from "@prisma/client";
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
import { Checkbox } from "@/components/ui/checkbox";
import { MutationForm } from "@/components/form/mutation-form";
import { AddressFields } from "@/components/form/address-fields";
import { updateSessionScheduleAction } from "@/actions/session-schedules";
import {
  WEEKDAY_OPTIONS,
  formatScheduleTime,
} from "@/lib/domain/schedule";
import { COURT_TYPE_LABELS, COURT_TYPES } from "@/lib/format";

const selectClassName =
  "flex h-10 w-full rounded-md border border-[var(--color-input)] bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]";

export type EditableSchedule = {
  id: string;
  startTime: string;
  endTime: string;
  weekdays: number[];
  courtType: CourtType;
  courtRental: number;
  address: string | null;
  googleAddressUrl: string | null;
};

export function SessionScheduleEditDialog({
  clubId,
  schedule,
  open,
  onOpenChange,
}: {
  clubId: string;
  schedule: EditableSchedule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);

  useEffect(() => {
    if (!schedule) return;
    setSelectedWeekdays(schedule.weekdays);
  }, [schedule]);

  function toggleWeekday(day: number) {
    setSelectedWeekdays((prev) =>
      prev.includes(day) ? prev.filter((value) => value !== day) : [...prev, day],
    );
  }

  if (!schedule) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sửa lịch đánh</DialogTitle>
        </DialogHeader>

        <MutationForm
          key={schedule.id}
          action={updateSessionScheduleAction.bind(null, clubId, schedule.id)}
          successMessage="Đã cập nhật lịch đánh"
          onSuccess={() => onOpenChange(false)}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`edit-schedule-start-${schedule.id}`} required>
                Giờ bắt đầu
              </Label>
              <Input
                id={`edit-schedule-start-${schedule.id}`}
                name="startTime"
                type="time"
                required
                defaultValue={formatScheduleTime(schedule.startTime)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`edit-schedule-end-${schedule.id}`} required>
                Giờ kết thúc
              </Label>
              <Input
                id={`edit-schedule-end-${schedule.id}`}
                name="endTime"
                type="time"
                required
                defaultValue={formatScheduleTime(schedule.endTime)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`edit-schedule-courtType-${schedule.id}`}>
                Loại sân
              </Label>
              <select
                id={`edit-schedule-courtType-${schedule.id}`}
                name="courtType"
                defaultValue={schedule.courtType}
                className={selectClassName}
              >
                {COURT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {COURT_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`edit-schedule-courtRental-${schedule.id}`} required>
                Thuê sân
              </Label>
              <Input
                id={`edit-schedule-courtRental-${schedule.id}`}
                name="courtRental"
                type="number"
                min={0}
                required
                defaultValue={schedule.courtRental}
              />
            </div>
          </div>

          <AddressFields
            idPrefix={`edit-schedule-${schedule.id}-`}
            defaultAddress={schedule.address ?? ""}
            defaultGoogleAddressUrl={schedule.googleAddressUrl ?? ""}
          />

          <div className="space-y-2">
            <Label required>Ngày trong tuần</Label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAY_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 rounded-md border px-3 py-2"
                >
                  <Checkbox
                    checked={selectedWeekdays.includes(option.value)}
                    onCheckedChange={() => toggleWeekday(option.value)}
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
            {selectedWeekdays.map((day) => (
              <input key={day} type="hidden" name="weekdays" value={day} />
            ))}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={selectedWeekdays.length === 0}>
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </MutationForm>
      </DialogContent>
    </Dialog>
  );
}
