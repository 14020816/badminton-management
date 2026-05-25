"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";
import { deleteShuttleTypeAction } from "@/actions/settings";
import {
  ShuttleTypeFormDialog,
  type EditableShuttleType,
} from "@/components/clubs/shuttle-type-form-dialog";
import {
  DEFAULT_SHUTTLES_PER_BLOCK,
  calcPricePerShuttle,
} from "@/lib/domain/shuttle";
import { formatVND } from "@/lib/format";

type ShuttleTypeItem = EditableShuttleType;

function ShuttleTypeActions({
  clubId,
  shuttle,
  canDelete,
  onEdit,
}: {
  clubId: string;
  shuttle: ShuttleTypeItem;
  canDelete: boolean;
  onEdit: (shuttle: ShuttleTypeItem) => void;
}) {
  return (
    <div className="flex shrink-0 gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onEdit(shuttle)}
      >
        Sửa
      </Button>
      {canDelete && (
        <ConfirmDeleteButton
          variant="destructive"
          size="sm"
          title="Xóa loại cầu?"
          description={
            <>
              Loại cầu &quot;{shuttle.name}&quot; sẽ bị xóa. Các buổi đánh đã ghi
              vẫn giữ dữ liệu cũ.
            </>
          }
          successMessage="Đã xóa loại cầu"
          onConfirm={async () => deleteShuttleTypeAction(clubId, shuttle.id)}
        />
      )}
    </div>
  );
}

function pricePerShuttleLabel(shuttle: ShuttleTypeItem) {
  return formatVND(
    Math.round(
      calcPricePerShuttle(
        shuttle.pricePerBlock,
        shuttle.shuttlesPerBlock || DEFAULT_SHUTTLES_PER_BLOCK,
      ),
    ),
  );
}

export function ShuttleTypesForm({
  clubId,
  initialTypes,
}: {
  clubId: string;
  initialTypes: ShuttleTypeItem[];
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editingShuttle, setEditingShuttle] = useState<ShuttleTypeItem | null>(
    null,
  );

  const canDelete = initialTypes.length > 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {initialTypes.length} loại cầu
        </p>
        <Button type="button" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Thêm loại cầu
        </Button>
      </div>

      {initialTypes.length === 0 ? (
        <p className="py-8 text-center text-sm text-[var(--color-muted-foreground)]">
          Chưa có loại cầu. Thêm loại cầu đầu tiên để ghi buổi đánh.
        </p>
      ) : (
        <ResponsiveDataView
          mobile={
            <MobileDataList>
              {initialTypes.map((shuttle) => (
                <MobileDataCard
                  key={shuttle.id}
                  title={shuttle.name}
                  actions={
                    <ShuttleTypeActions
                      clubId={clubId}
                      shuttle={shuttle}
                      canDelete={canDelete}
                      onEdit={setEditingShuttle}
                    />
                  }
                >
                  <MobileDataFields>
                    <MobileDataField
                      label="Giá hộp"
                      valueClassName="font-number text-right"
                    >
                      {formatVND(shuttle.pricePerBlock)}
                    </MobileDataField>
                    <MobileDataField label="Quả / hộp">
                      {shuttle.shuttlesPerBlock}
                    </MobileDataField>
                    <MobileDataField
                      label="Giá / quả"
                      valueClassName="font-number text-right"
                    >
                      {pricePerShuttleLabel(shuttle)}
                    </MobileDataField>
                    <MobileDataField
                      label="Tồn kho"
                      valueClassName="font-number text-right"
                    >
                      {shuttle.inventory} quả
                    </MobileDataField>
                  </MobileDataFields>
                </MobileDataCard>
              ))}
            </MobileDataList>
          }
          desktop={
            <Table minWidth="40rem">
              <TableHeader>
                <TableRow>
                  <TableHead>Tên</TableHead>
                  <TableHead className="text-right">Giá hộp</TableHead>
                  <TableHead className="text-right">Quả / hộp</TableHead>
                  <TableHead className="text-right">Giá / quả</TableHead>
                  <TableHead className="text-right">Tồn kho</TableHead>
                  <TableHead className="w-36">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialTypes.map((shuttle) => (
                  <TableRow key={shuttle.id}>
                    <TableCell className="font-medium">{shuttle.name}</TableCell>
                    <TableCell className="font-number text-right">
                      {formatVND(shuttle.pricePerBlock)}
                    </TableCell>
                    <TableCell className="font-number text-right">
                      {shuttle.shuttlesPerBlock}
                    </TableCell>
                    <TableCell className="font-number text-right">
                      {pricePerShuttleLabel(shuttle)}
                    </TableCell>
                    <TableCell className="font-number text-right">
                      {shuttle.inventory} quả
                    </TableCell>
                    <TableCell>
                      <ShuttleTypeActions
                        clubId={clubId}
                        shuttle={shuttle}
                        canDelete={canDelete}
                        onEdit={setEditingShuttle}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          }
        />
      )}

      <ShuttleTypeFormDialog
        clubId={clubId}
        shuttle={null}
        mode="add"
        open={addOpen}
        onOpenChange={setAddOpen}
      />

      <ShuttleTypeFormDialog
        clubId={clubId}
        shuttle={editingShuttle}
        mode="edit"
        open={editingShuttle !== null}
        onOpenChange={(open) => {
          if (!open) setEditingShuttle(null);
        }}
      />
    </div>
  );
}
