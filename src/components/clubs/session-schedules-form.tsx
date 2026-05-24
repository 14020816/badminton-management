"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MutationForm } from "@/components/form/mutation-form";
import { AddressFields } from "@/components/form/address-fields";
import {
  createSessionScheduleAction,
  setSessionScheduleEnabledAction,
} from "@/actions/session-schedules";
import {
  SessionScheduleEditDialog,
  type EditableSchedule,
} from "@/components/clubs/session-schedule-edit-dialog";
import {
  WEEKDAY_OPTIONS,
  formatScheduleTimeRange,
  formatWeekdays,
} from "@/lib/domain/schedule";
import { COURT_TYPE_LABELS, COURT_TYPES, formatCourtType, formatVND } from "@/lib/format";
import { cn } from "@/lib/utils";

type ScheduleRow = EditableSchedule & { enabled: boolean };

const selectClassName =
  "flex h-10 w-full rounded-md border border-[var(--color-input)] bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]";

export function SessionSchedulesForm({
  clubId,
  schedules,
}: {
  clubId: string;
  schedules: ScheduleRow[];
}) {
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
  const [editingSchedule, setEditingSchedule] = useState<EditableSchedule | null>(
    null,
  );

  function toggleWeekday(day: number) {
    setSelectedWeekdays((prev) =>
      prev.includes(day) ? prev.filter((value) => value !== day) : [...prev, day],
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Thêm lịch đánh cố định</CardTitle>
        </CardHeader>
        <CardContent>
          <MutationForm
            action={createSessionScheduleAction.bind(null, clubId)}
            successMessage="Đã thêm lịch đánh"
            className="space-y-4"
            onSuccess={() => setSelectedWeekdays([])}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="schedule-startTime" required>
                  Giờ bắt đầu
                </Label>
                <Input id="schedule-startTime" name="startTime" type="time" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule-endTime" required>
                  Giờ kết thúc
                </Label>
                <Input id="schedule-endTime" name="endTime" type="time" required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="schedule-courtType">Loại sân</Label>
                <select
                  id="schedule-courtType"
                  name="courtType"
                  defaultValue="FIXED"
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
                <Label htmlFor="schedule-courtRental" required>
                  Thuê sân
                </Label>
                <Input
                  id="schedule-courtRental"
                  name="courtRental"
                  type="number"
                  min={0}
                  required
                  defaultValue={0}
                />
              </div>
            </div>

            <AddressFields idPrefix="schedule-" />

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

            <Button type="submit" disabled={selectedWeekdays.length === 0}>
              Thêm lịch
            </Button>
          </MutationForm>
        </CardContent>
      </Card>

      {schedules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Lịch đánh hàng tuần</CardTitle>
          </CardHeader>
          <CardContent>
            <Table minWidth="32rem">
              <TableHeader>
                <TableRow>
                  <TableHead>Giờ</TableHead>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Loại sân</TableHead>
                  <TableHead>Địa chỉ</TableHead>
                  <TableHead className="text-right">Thuê sân</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-[10rem]">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule) => (
                  <TableRow
                    key={schedule.id}
                    className={cn(!schedule.enabled && "opacity-60")}
                  >
                    <TableCell>
                      {formatScheduleTimeRange(schedule.startTime, schedule.endTime)}
                    </TableCell>
                    <TableCell>{formatWeekdays(schedule.weekdays)}</TableCell>
                    <TableCell>{formatCourtType(schedule.courtType)}</TableCell>
                    <TableCell className="max-w-[12rem] truncate">
                      {schedule.address ?? "—"}
                    </TableCell>
                    <TableCell className="font-number text-right">
                      {formatVND(schedule.courtRental)}
                    </TableCell>
                    <TableCell>
                      {schedule.enabled ? (
                        <Badge variant="secondary">Đang dùng</Badge>
                      ) : (
                        <Badge variant="outline">Đã tắt</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setEditingSchedule({
                              id: schedule.id,
                              startTime: schedule.startTime,
                              endTime: schedule.endTime,
                              weekdays: schedule.weekdays,
                              courtType: schedule.courtType,
                              courtRental: schedule.courtRental,
                              address: schedule.address,
                              googleAddressUrl: schedule.googleAddressUrl,
                            })
                          }
                        >
                          Sửa
                        </Button>
                        <MutationForm
                          action={async () =>
                            setSessionScheduleEnabledAction(
                              clubId,
                              schedule.id,
                              !schedule.enabled,
                            )
                          }
                          successMessage={
                            schedule.enabled
                              ? "Đã tắt lịch đánh"
                              : "Đã bật lịch đánh"
                          }
                        >
                          <Button
                            variant={schedule.enabled ? "outline" : "default"}
                            size="sm"
                            type="submit"
                          >
                            {schedule.enabled ? "Tắt" : "Bật lại"}
                          </Button>
                        </MutationForm>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <SessionScheduleEditDialog
        clubId={clubId}
        schedule={editingSchedule}
        open={editingSchedule !== null}
        onOpenChange={(open) => {
          if (!open) setEditingSchedule(null);
        }}
      />
    </div>
  );
}
