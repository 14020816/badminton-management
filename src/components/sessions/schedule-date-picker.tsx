"use client";

import { useEffect, useMemo } from "react";
import { parseISO } from "date-fns";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import {
  isSelectableScheduleDate,
  toDateInputValue,
} from "@/lib/domain/schedule";

type FulfilledSession = {
  scheduleId: string;
  date: string | Date;
};

export function ScheduleDatePicker({
  schedule,
  fulfilled,
  value,
  onChange,
}: {
  schedule: { id: string; weekdays: number[] };
  fulfilled: FulfilledSession[];
  value: string;
  onChange: (value: string) => void;
}) {
  const fulfilledForSchedule = useMemo(
    () => fulfilled.filter((entry) => entry.scheduleId === schedule.id),
    [fulfilled, schedule.id],
  );

  const hasSelectableDates = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let offset = -28; offset <= 84; offset++) {
      const candidate = new Date(today);
      candidate.setDate(candidate.getDate() + offset);
      if (
        isSelectableScheduleDate(candidate, schedule, fulfilledForSchedule)
      ) {
        return true;
      }
    }

    return false;
  }, [fulfilledForSchedule, schedule]);

  useEffect(() => {
    if (value || !hasSelectableDates) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let offset = -28; offset <= 84; offset++) {
      const candidate = new Date(today);
      candidate.setDate(candidate.getDate() + offset);
      if (
        isSelectableScheduleDate(candidate, schedule, fulfilledForSchedule)
      ) {
        onChange(toDateInputValue(candidate));
        return;
      }
    }
  }, [fulfilledForSchedule, hasSelectableDates, onChange, schedule, value]);

  const selectedDate = value ? parseISO(value) : undefined;

  return (
    <div className="space-y-2">
      <Label htmlFor="scheduled-date" required>
        Ngày
      </Label>
      <input type="hidden" name="date" value={value} required />
      <DatePicker
        id="scheduled-date"
        value={selectedDate}
        onChange={(date) => onChange(date ? toDateInputValue(date) : "")}
        placeholder={
          hasSelectableDates ? "Chọn ngày" : "Không còn ngày cần ghi"
        }
        disabled={!hasSelectableDates}
        disabledDates={(date) =>
          !isSelectableScheduleDate(date, schedule, fulfilledForSchedule)
        }
      />
    </div>
  );
}
