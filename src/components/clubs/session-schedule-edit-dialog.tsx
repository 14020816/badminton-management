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
import { MutationForm, SubmitButton } from "@/components/form/mutation-form";
import { FormSelect } from "@/components/form/form-select";
import { AddressFields } from "@/components/form/address-fields";
import {
  createSessionScheduleAction,
  updateSessionScheduleAction,
} from "@/actions/session-schedules";
import { WEEKDAY_OPTIONS, formatScheduleTime } from "@/lib/domain/schedule";
import { COURT_TYPE_LABELS, COURT_TYPES } from "@/lib/format";

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

export function SessionScheduleFormDialog({
  clubId,
  schedule,
  mode,
  open,
  onOpenChange,
}: {
  clubId: string;
  schedule: EditableSchedule | null;
  mode: "add" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);

  useEffect(() => {
    if (!open) return;
    setSelectedWeekdays(mode === "edit" && schedule ? schedule.weekdays : []);
  }, [mode, open, schedule]);

  if (!open) return null;
  if (mode === "edit" && !schedule) return null;

  const defaults =
    mode === "edit" && schedule
      ? schedule
      : {
          startTime: "",
          endTime: "",
          courtType: "FIXED" as CourtType,
          courtRental: 0,
          address: null,
          googleAddressUrl: null,
        };

  const action =
    mode === "edit" && schedule
      ? updateSessionScheduleAction.bind(null, clubId, schedule.id)
      : createSessionScheduleAction.bind(null, clubId);

  const formKey = mode === "edit" && schedule ? schedule.id : "add";

  function toggleWeekday(day: number) {
    setSelectedWeekdays((prev) =>
      prev.includes(day) ? prev.filter((value) => value !== day) : [...prev, day],
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Sửa lịch đánh" : "Thêm lịch đánh cố định"}
          </DialogTitle>
        </DialogHeader>

        <MutationForm
          key={formKey}
          action={action}
          successMessage={
            mode === "edit" ? "Đã cập nhật lịch đánh" : "Đã thêm lịch đánh"
          }
          onSuccess={() => onOpenChange(false)}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`schedule-start-${formKey}`} required>
                Giờ bắt đầu
              </Label>
              <Input
                id={`schedule-start-${formKey}`}
                name="startTime"
                type="time"
                required
                defaultValue={
                  defaults.startTime
                    ? formatScheduleTime(defaults.startTime)
                    : undefined
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`schedule-end-${formKey}`} required>
                Giờ kết thúc
              </Label>
              <Input
                id={`schedule-end-${formKey}`}
                name="endTime"
                type="time"
                required
                defaultValue={
                  defaults.endTime
                    ? formatScheduleTime(defaults.endTime)
                    : undefined
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`schedule-courtType-${formKey}`}>Loại sân</Label>
              <FormSelect
                id={`schedule-courtType-${formKey}`}
                name="courtType"
                defaultValue={defaults.courtType}
                options={COURT_TYPES.map((type) => ({
                  value: type,
                  label: COURT_TYPE_LABELS[type],
                }))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`schedule-courtRental-${formKey}`} required>
                Thuê sân
              </Label>
              <Input
                id={`schedule-courtRental-${formKey}`}
                name="courtRental"
                type="number"
                min={0}
                required
                defaultValue={defaults.courtRental}
              />
            </div>
          </div>

          <AddressFields
            idPrefix={`schedule-${formKey}-`}
            defaultAddress={defaults.address ?? ""}
            defaultGoogleAddressUrl={defaults.googleAddressUrl ?? ""}
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
            <SubmitButton
              pendingText={mode === "edit" ? "Đang lưu..." : "Đang thêm..."}
              disabled={selectedWeekdays.length === 0}
            >
              {mode === "edit" ? "Lưu thay đổi" : "Thêm lịch"}
            </SubmitButton>
          </DialogFooter>
        </MutationForm>
      </DialogContent>
    </Dialog>
  );
}

/** @deprecated Use SessionScheduleFormDialog */
export const SessionScheduleEditDialog = SessionScheduleFormDialog;
