"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MobileDataCard,
  MobileDataField,
  MobileDataFields,
  MobileDataList,
  ResponsiveDataView,
} from "@/components/ui/mobile-data-list";
import { MutationForm, SubmitButton } from "@/components/form/mutation-form";
import { setSessionScheduleEnabledAction } from "@/actions/session-schedules";
import {
  SessionScheduleFormDialog,
  type EditableSchedule,
} from "@/components/clubs/session-schedule-edit-dialog";
import { formatScheduleTimeRange, formatWeekdays } from "@/lib/domain/schedule";
import { formatCourtType, formatVND } from "@/lib/format";
import { cn } from "@/lib/utils";

type ScheduleRow = EditableSchedule & { enabled: boolean };

export function SessionSchedulesForm({
  clubId,
  schedules,
}: {
  clubId: string;
  schedules: ScheduleRow[];
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] =
    useState<EditableSchedule | null>(null);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <CardTitle>Lịch đánh hàng tuần</CardTitle>
          <Button type="button" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Thêm lịch đánh
          </Button>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--color-muted-foreground)]">
              Chưa có lịch cố định. Thêm lịch để ghi nhận buổi đánh nhanh hơn.
            </p>
          ) : (
            <ResponsiveDataView
              mobile={
                <MobileDataList>
                  {schedules.map((schedule) => (
                    <MobileDataCard
                      key={schedule.id}
                      className={cn(!schedule.enabled && "opacity-60")}
                      title={formatScheduleTimeRange(
                        schedule.startTime,
                        schedule.endTime,
                      )}
                      actions={
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
                            <SubmitButton
                              variant={schedule.enabled ? "outline" : "default"}
                              size="sm"
                              pendingText="Đang cập nhật..."
                            >
                              {schedule.enabled ? "Tắt" : "Bật lại"}
                            </SubmitButton>
                          </MutationForm>
                        </div>
                      }
                    >
                      <MobileDataFields>
                        <MobileDataField label="Ngày">
                          {formatWeekdays(schedule.weekdays)}
                        </MobileDataField>
                        <MobileDataField label="Loại sân">
                          {formatCourtType(schedule.courtType)}
                        </MobileDataField>
                        <MobileDataField
                          label="Thuê sân"
                          valueClassName="font-number text-right"
                        >
                          {formatVND(schedule.courtRental)}
                        </MobileDataField>
                        <MobileDataField label="Trạng thái">
                          {schedule.enabled ? (
                            <Badge variant="default">Đang dùng</Badge>
                          ) : (
                            <Badge variant="outline">Đã tắt</Badge>
                          )}
                        </MobileDataField>
                        <MobileDataField label="Địa chỉ" fullWidth>
                          {schedule.address ?? "—"}
                        </MobileDataField>
                      </MobileDataFields>
                    </MobileDataCard>
                  ))}
                </MobileDataList>
              }
              desktop={
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
                          {formatScheduleTimeRange(
                            schedule.startTime,
                            schedule.endTime,
                          )}
                        </TableCell>
                        <TableCell>
                          {formatWeekdays(schedule.weekdays)}
                        </TableCell>
                        <TableCell>
                          {formatCourtType(schedule.courtType)}
                        </TableCell>
                        <TableCell className="max-w-[12rem] truncate">
                          {schedule.address ?? "—"}
                        </TableCell>
                        <TableCell className="font-number text-right">
                          {formatVND(schedule.courtRental)}
                        </TableCell>
                        <TableCell>
                          {schedule.enabled ? (
                            <Badge variant="default">Đang dùng</Badge>
                          ) : (
                            <Badge variant="outline">Đã tắt</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Button
                              type="button"
                              variant="default"
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
                              <SubmitButton
                                variant={
                                  schedule.enabled ? "outline" : "default"
                                }
                                size="sm"
                                pendingText="Đang cập nhật..."
                              >
                                {schedule.enabled ? "Tắt" : "Bật lại"}
                              </SubmitButton>
                            </MutationForm>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              }
            />
          )}
        </CardContent>
      </Card>

      <SessionScheduleFormDialog
        clubId={clubId}
        schedule={null}
        mode="add"
        open={addOpen}
        onOpenChange={setAddOpen}
      />

      <SessionScheduleFormDialog
        clubId={clubId}
        schedule={editingSchedule}
        mode="edit"
        open={editingSchedule !== null}
        onOpenChange={(open) => {
          if (!open) setEditingSchedule(null);
        }}
      />
    </div>
  );
}
