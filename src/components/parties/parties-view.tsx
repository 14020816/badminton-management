"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
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
import {
  createPartyAction,
  deletePartyAction,
  updatePartyAction,
} from "@/actions/parties";
import { PageHeader } from "@/components/layout/page-header";
import { MutationForm, SubmitButton } from "@/components/form/mutation-form";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";
import {
  PartyMemberCostsEditor,
  buildInitialPartyAllocations,
  type PartyMemberAllocationState,
} from "@/components/parties/party-member-costs-editor";
import { formatDate, formatDateInput, formatVND } from "@/lib/format";

type Member = { id: string; name: string };

type Party = {
  id: string;
  date: Date | null;
  location: string | null;
  totalCost: number;
  note: string | null;
  members: {
    id: string;
    amount: number;
    countsToBudget: boolean;
    member: { id: string; name: string };
  }[];
};

function PartyFormFields({
  members,
  allocations,
  onAllocationsChange,
  defaultValues,
}: {
  members: Member[];
  allocations: PartyMemberAllocationState[];
  onAllocationsChange: Dispatch<SetStateAction<PartyMemberAllocationState[]>>;
  defaultValues?: {
    date?: Date | null;
    location?: string | null;
    totalCost?: number;
    note?: string | null;
  };
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="date">Ngày</Label>
        <Input
          id="date"
          name="date"
          type="date"
          defaultValue={
            defaultValues?.date ? formatDateInput(defaultValues.date) : ""
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">Địa điểm</Label>
        <Input
          id="location"
          name="location"
          defaultValue={defaultValues?.location ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="totalCost">Tổng chi phí</Label>
        <CurrencyInput
          id="totalCost"
          name="totalCost"
          defaultValue={defaultValues?.totalCost ?? 0}
        />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="note">Ghi chú</Label>
        <Input id="note" name="note" defaultValue={defaultValues?.note ?? ""} />
      </div>
      <PartyMemberCostsEditor
        members={members}
        allocations={allocations}
        onChange={onAllocationsChange}
      />
    </>
  );
}

export function PartiesView({
  clubId,
  parties,
  members,
  isAdmin,
}: {
  clubId: string;
  parties: Party[];
  members: Member[];
  isAdmin: boolean;
}) {
  const [createAllocations, setCreateAllocations] = useState<
    PartyMemberAllocationState[]
  >([]);
  const [editingPartyId, setEditingPartyId] = useState<string | null>(null);
  const [editAllocations, setEditAllocations] = useState<
    PartyMemberAllocationState[]
  >([]);

  function startEdit(party: Party) {
    setEditingPartyId(party.id);
    setEditAllocations(
      buildInitialPartyAllocations(
        party.members.map((member) => ({
          memberId: member.member.id,
          amount: member.amount,
          countsToBudget: member.countsToBudget,
        })),
      ),
    );
  }

  function cancelEdit() {
    setEditingPartyId(null);
    setEditAllocations([]);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Liên hoan"
        description="Ghi nhận chi phí liên hoan và phân bổ từng thành viên"
      />

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Tạo liên hoan</CardTitle>
          </CardHeader>
          <CardContent>
            <MutationForm
              action={createPartyAction.bind(null, clubId)}
              successMessage="Đã tạo liên hoan"
              className="grid gap-4 md:grid-cols-2"
              onSuccess={() => setCreateAllocations([])}
            >
              <PartyFormFields
                members={members}
                allocations={createAllocations}
                onAllocationsChange={setCreateAllocations}
              />
              <div className="md:col-span-2">
                <SubmitButton pendingText="Đang tạo...">Tạo liên hoan</SubmitButton>
              </div>
            </MutationForm>
          </CardContent>
        </Card>
      )}

      {parties.map((party) => {
        const isEditing = editingPartyId === party.id;
        const title =
          party.location ??
          party.note ??
          (party.date ? formatDate(party.date) : "Liên hoan");

        return (
          <Card key={party.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle>{title}</CardTitle>
                {party.date && (
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    {formatDate(party.date)}
                  </p>
                )}
              </div>
              {isAdmin && !isEditing && (
                <div className="flex shrink-0 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={() => startEdit(party)}
                  >
                    Sửa
                  </Button>
                  <ConfirmDeleteButton
                    size="sm"
                    variant="destructive"
                    title="Xóa liên hoan?"
                    description={
                      <>
                        Liên hoan
                        {party.date ? ` ngày ${formatDate(party.date)}` : ""}
                        {party.location ? ` tại ${party.location}` : ""} sẽ bị
                        xóa. Hành động này không thể hoàn tác.
                      </>
                    }
                    successMessage="Đã xóa liên hoan"
                    onConfirm={async () => {
                      const formData = new FormData();
                      formData.set("partyId", party.id);
                      await deletePartyAction(clubId, formData);
                    }}
                  />
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <MutationForm
                  action={updatePartyAction.bind(null, clubId)}
                  successMessage="Đã cập nhật liên hoan"
                  className="grid gap-4 md:grid-cols-2"
                  onSuccess={cancelEdit}
                >
                  <input type="hidden" name="partyId" value={party.id} />
                  <PartyFormFields
                    members={members}
                    allocations={editAllocations}
                    onAllocationsChange={setEditAllocations}
                    defaultValues={{
                      date: party.date,
                      location: party.location,
                      totalCost: party.totalCost,
                      note: party.note,
                    }}
                  />
                  <div className="flex gap-2 md:col-span-2">
                    <SubmitButton pendingText="Đang lưu...">Lưu</SubmitButton>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={cancelEdit}
                    >
                      Hủy
                    </Button>
                  </div>
                </MutationForm>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <p>
                      Địa điểm:{" "}
                      <span className="font-medium">
                        {party.location ?? "—"}
                      </span>
                    </p>
                    <p>
                      Tổng chi phí:{" "}
                      <span className="font-number font-medium">
                        {formatVND(party.totalCost)}
                      </span>
                    </p>
                  </div>
                  {party.note && (
                    <p className="text-sm text-[var(--color-muted-foreground)]">
                      {party.note}
                    </p>
                  )}

                  <ResponsiveDataView
                    mobile={
                      <MobileDataList>
                        {party.members.map((member) => (
                          <MobileDataCard
                            key={member.id}
                            title={member.member.name}
                          >
                            <MobileDataFields>
                              <MobileDataField
                                label="Số tiền"
                                valueClassName="font-number text-right font-medium"
                              >
                                {formatVND(member.amount)}
                              </MobileDataField>
                              <MobileDataField label="Quỹ">
                                <Badge
                                  variant={
                                    member.countsToBudget
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {member.countsToBudget
                                    ? "Tính vào quỹ"
                                    : "Trả trực tiếp"}
                                </Badge>
                              </MobileDataField>
                            </MobileDataFields>
                          </MobileDataCard>
                        ))}
                      </MobileDataList>
                    }
                    desktop={
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Thành viên</TableHead>
                            <TableHead className="text-right">Số tiền</TableHead>
                            <TableHead>Quỹ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {party.members.map((member) => (
                            <TableRow key={member.id}>
                              <TableCell>{member.member.name}</TableCell>
                              <TableCell className="font-number text-right font-medium">
                                {formatVND(member.amount)}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    member.countsToBudget
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {member.countsToBudget
                                    ? "Tính vào quỹ"
                                    : "Trả trực tiếp"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    }
                  />
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
