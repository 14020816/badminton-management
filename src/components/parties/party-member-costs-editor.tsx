"use client";

import { useMemo, type Dispatch, type SetStateAction } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  MobileDataList,
  MobileEditorField,
  ResponsiveDataView,
} from "@/components/ui/mobile-data-list";
import type { PartyMemberAllocationPayload } from "@/lib/domain/parties";
import { formatVND } from "@/lib/format";

type Member = { id: string; name: string };

export type PartyMemberAllocationState = PartyMemberAllocationPayload & {
  memberId: string;
  amount: number;
  countsToBudget: boolean;
};

export function PartyMemberCostsEditor({
  members,
  allocations,
  onChange,
}: {
  members: Member[];
  allocations: PartyMemberAllocationState[];
  onChange: Dispatch<SetStateAction<PartyMemberAllocationState[]>>;
}) {
  const selectedIds = useMemo(
    () => new Set(allocations.map((row) => row.memberId)),
    [allocations],
  );

  const allocatedTotal = allocations.reduce(
    (sum, row) => sum + (row.amount ?? 0),
    0,
  );

  function toggleMember(memberId: string) {
    onChange((current) => {
      const exists = current.some((row) => row.memberId === memberId);
      if (exists) {
        return current.filter((row) => row.memberId !== memberId);
      }
      return [
        ...current,
        {
          memberId,
          amount: 0,
          countsToBudget: false,
        },
      ];
    });
  }

  function updateRow(
    memberId: string,
    patch: Partial<PartyMemberAllocationState>,
  ) {
    onChange((current) =>
      current.map((row) =>
        row.memberId === memberId ? { ...row, ...patch } : row,
      ),
    );
  }

  return (
    <div className="space-y-4 md:col-span-2">
      <div className="space-y-2">
        <Label required>Người tham gia</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {members.map((member) => (
            <label
              key={member.id}
              className="flex items-center gap-2 rounded-md border p-2"
            >
              <Checkbox
                checked={selectedIds.has(member.id)}
                onCheckedChange={() => toggleMember(member.id)}
              />
              <span className="text-sm">{member.name}</span>
            </label>
          ))}
        </div>
      </div>

      {allocations.length > 0 && (
        <div className="space-y-3">
          <Label>Chi phí từng người</Label>
          <div className="rounded-md border">
            <ResponsiveDataView
              mobile={
                <MobileDataList className="p-2">
                  {allocations.map((row) => {
                    const member = members.find(
                      (item) => item.id === row.memberId,
                    );
                    if (!member) return null;

                    return (
                      <MobileDataCard key={row.memberId} title={member.name}>
                        <div className="space-y-3">
                          <MobileEditorField label="Số tiền">
                            <Input
                              type="number"
                              min={0}
                              value={row.amount}
                              onChange={(event) =>
                                updateRow(row.memberId, {
                                  amount: Number(event.target.value) || 0,
                                })
                              }
                              className="font-number text-right"
                            />
                          </MobileEditorField>
                          <MobileEditorField label="Tính vào quỹ">
                            <label className="flex items-center gap-2">
                              <Checkbox
                                checked={row.countsToBudget}
                                onCheckedChange={(checked) =>
                                  updateRow(row.memberId, {
                                    countsToBudget: checked === true,
                                  })
                                }
                                aria-label={`Tính vào quỹ cho ${member.name}`}
                              />
                              <span className="text-sm">Tính vào quỹ</span>
                            </label>
                          </MobileEditorField>
                        </div>
                      </MobileDataCard>
                    );
                  })}
                </MobileDataList>
              }
              desktop={
                <Table minWidth="28rem">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Thành viên</TableHead>
                      <TableHead className="text-right">Số tiền</TableHead>
                      <TableHead className="text-center">Tính vào quỹ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allocations.map((row) => {
                      const member = members.find(
                        (item) => item.id === row.memberId,
                      );
                      if (!member) return null;

                      return (
                        <TableRow key={row.memberId}>
                          <TableCell className="font-medium">
                            {member.name}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              value={row.amount}
                              onChange={(event) =>
                                updateRow(row.memberId, {
                                  amount: Number(event.target.value) || 0,
                                })
                              }
                              className="font-number text-right"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={row.countsToBudget}
                              onCheckedChange={(checked) =>
                                updateRow(row.memberId, {
                                  countsToBudget: checked === true,
                                })
                              }
                              aria-label={`Tính vào quỹ cho ${member.name}`}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              }
            />
          </div>

          <p className="text-sm text-[var(--color-muted-foreground)]">
            Tổng phân bổ:{" "}
            <span className="font-number font-medium text-[var(--body)]">
              {formatVND(allocatedTotal)}
            </span>
            {" · "}
            {allocations.length} người tham gia
          </p>
        </div>
      )}

      <input
        type="hidden"
        name="memberAllocations"
        value={JSON.stringify(allocations)}
      />
    </div>
  );
}

export function buildInitialPartyAllocations(
  members: {
    memberId: string;
    amount: number;
    countsToBudget: boolean;
  }[],
): PartyMemberAllocationState[] {
  return members.map((member) => ({
    memberId: member.memberId,
    amount: member.amount,
    countsToBudget: member.countsToBudget,
  }));
}
