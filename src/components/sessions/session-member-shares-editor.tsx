"use client";

import {
  Fragment,
  useEffect,
  useMemo,
  type Dispatch,
  type SetStateAction,
} from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  MobileDataList,
  MobileEditorField,
  ResponsiveDataView,
} from "@/components/ui/mobile-data-list";
import {
  attendeeCount,
  calcCostPerPerson,
  calcSessionAllocations,
  calcSharedSessionBase,
  defaultShareAmount,
  type GuestAllocationPayload,
  type ShareAllocationPayload,
} from "@/lib/domain/sessions";
import { formatVND } from "@/lib/format";

type Member = { id: string; name: string };

type ShuttlePricing = {
  pricePerBlock: number;
  shuttlesPerBlock: number;
};

function createGuestId() {
  return `guest-${Math.random().toString(36).slice(2, 10)}`;
}

function calcMemberDefaultAmount(
  sharedBasePerPerson: number,
  row: ShareAllocationPayload,
  guests: GuestAllocationPayload[],
): number {
  const hostedGuests = guests.filter(
    (guest) => guest.hostedByMemberId === row.memberId,
  );
  let amount = defaultShareAmount(sharedBasePerPerson, row);

  if (row.memberPaysForGuests) {
    amount += sharedBasePerPerson * hostedGuests.length;
    for (const guest of hostedGuests) {
      amount +=
        Math.max(0, guest.water) +
        Math.max(0, guest.parking) +
        Math.max(0, guest.extra);
    }
  }

  return amount;
}

function calcGuestDefaultAmount(
  sharedBasePerPerson: number,
  guest: GuestAllocationPayload,
  members: ShareAllocationPayload[],
): number {
  if (!guest.hostedByMemberId) {
    return defaultShareAmount(sharedBasePerPerson, guest);
  }

  const host = members.find(
    (member) => member.memberId === guest.hostedByMemberId,
  );
  if (host?.memberPaysForGuests) {
    return 0;
  }

  return defaultShareAmount(sharedBasePerPerson, guest);
}

export function SessionMemberSharesEditor({
  members,
  courtRental,
  shuttlesUsed,
  shuttlePricing,
  allocations,
  onChange,
  guests,
  onGuestsChange,
}: {
  members: Member[];
  courtRental: number;
  shuttlesUsed: number;
  shuttlePricing: ShuttlePricing;
  allocations: ShareAllocationPayload[];
  onChange: Dispatch<SetStateAction<ShareAllocationPayload[]>>;
  guests: GuestAllocationPayload[];
  onGuestsChange: Dispatch<SetStateAction<GuestAllocationPayload[]>>;
}) {
  const sharedBase = useMemo(
    () =>
      calcSharedSessionBase({
        courtRental,
        shuttlesUsed,
        shuttlePricing,
      }),
    [courtRental, shuttlesUsed, shuttlePricing],
  );

  const totalAttendees = attendeeCount(allocations, guests);

  const sharedBasePerPerson = useMemo(
    () => calcCostPerPerson(sharedBase, totalAttendees),
    [sharedBase, totalAttendees],
  );

  const selectedIds = useMemo(
    () => new Set(allocations.map((row) => row.memberId)),
    [allocations],
  );

  useEffect(() => {
    onChange((current) => {
      if (current.length === 0) return current;

      let changed = false;
      const next = current.map((row) => {
        if (row.amountCustom) return row;
        const amount = calcMemberDefaultAmount(
          sharedBasePerPerson,
          row,
          guests,
        );
        if (amount === row.amount) return row;
        changed = true;
        return { ...row, amount };
      });

      return changed ? next : current;
    });
  }, [guests, onChange, sharedBasePerPerson]);

  useEffect(() => {
    onGuestsChange((current) => {
      if (current.length === 0) return current;

      let changed = false;
      const next = current.map((guest) => {
        if (guest.amountCustom) return guest;
        const amount = calcGuestDefaultAmount(
          sharedBasePerPerson,
          guest,
          allocations,
        );
        if (amount === guest.amount) return guest;
        changed = true;
        return { ...guest, amount };
      });

      return changed ? next : current;
    });
  }, [allocations, onGuestsChange, sharedBasePerPerson]);

  const preview = useMemo(
    () =>
      calcSessionAllocations(
        sharedBase,
        allocations.map((row) => ({
          memberId: row.memberId,
          memberPaysForGuests: row.memberPaysForGuests,
          water: row.water,
          parking: row.parking,
          extra: row.extra,
          extraNote: row.extraNote,
          amount: row.amountCustom ? row.amount : null,
        })),
        guests.map((guest) => ({
          name: guest.name,
          hostedByMemberId: guest.hostedByMemberId,
          water: guest.water,
          parking: guest.parking,
          extra: guest.extra,
          extraNote: guest.extraNote,
          amount: guest.amountCustom ? guest.amount : null,
        })),
      ),
    [allocations, guests, sharedBase],
  );

  const totalCost =
    preview.shares.reduce((sum, share) => sum + share.amount, 0) +
    preview.guests.reduce((sum, guest) => sum + guest.amount, 0);

  function toggleMember(memberId: string) {
    onChange((current) => {
      const exists = current.some((row) => row.memberId === memberId);
      if (exists) {
        onGuestsChange((guestRows) =>
          guestRows.filter((guest) => guest.hostedByMemberId !== memberId),
        );
        return current.filter((row) => row.memberId !== memberId);
      }

      const nextCount = current.length + 1 + guests.length;
      const basePerPerson = calcCostPerPerson(sharedBase, nextCount);

      return [
        ...current,
        {
          memberId,
          water: 0,
          parking: 0,
          extra: 0,
          extraNote: null,
          amount: basePerPerson,
          amountCustom: false,
          memberPaysForGuests: false,
        },
      ];
    });
  }

  function updateRow(memberId: string, patch: Partial<ShareAllocationPayload>) {
    onChange((current) => {
      const nextMembers = current.map((row) => {
        if (row.memberId !== memberId) return row;
        const updated = { ...row, ...patch };
        if ("memberPaysForGuests" in patch) {
          updated.amountCustom = false;
        }
        if (!updated.amountCustom) {
          updated.amount = calcMemberDefaultAmount(
            sharedBasePerPerson,
            updated,
            guests,
          );
        }
        return updated;
      });

      if ("memberPaysForGuests" in patch) {
        onGuestsChange((currentGuests) =>
          currentGuests.map((guest) => {
            if (guest.hostedByMemberId !== memberId) return guest;
            const updatedGuest = { ...guest, amountCustom: false };
            updatedGuest.amount = calcGuestDefaultAmount(
              sharedBasePerPerson,
              updatedGuest,
              nextMembers,
            );
            return updatedGuest;
          }),
        );
      }

      return nextMembers;
    });
  }

  function addHostedGuest(memberId: string) {
    onGuestsChange((current) => [
      ...current,
      {
        clientId: createGuestId(),
        name: "",
        hostedByMemberId: memberId,
        water: 0,
        parking: 0,
        extra: 0,
        extraNote: null,
        amount: sharedBasePerPerson,
        amountCustom: false,
      },
    ]);
  }

  function addStandaloneGuest() {
    onGuestsChange((current) => [
      ...current,
      {
        clientId: createGuestId(),
        name: "",
        hostedByMemberId: null,
        water: 0,
        parking: 0,
        extra: 0,
        extraNote: null,
        amount: sharedBasePerPerson,
        amountCustom: false,
      },
    ]);
  }

  function updateGuest(
    clientId: string,
    patch: Partial<GuestAllocationPayload>,
  ) {
    onGuestsChange((current) =>
      current.map((guest) => {
        if (guest.clientId !== clientId) return guest;
        const updated = { ...guest, ...patch };
        if (!updated.amountCustom) {
          updated.amount = calcGuestDefaultAmount(
            sharedBasePerPerson,
            updated,
            allocations,
          );
        }
        return updated;
      }),
    );
  }

  function removeGuest(clientId: string) {
    onGuestsChange((current) =>
      current.filter((guest) => guest.clientId !== clientId),
    );
  }

  const standaloneGuests = guests.filter((guest) => !guest.hostedByMemberId);

  function renderMemberEditorFields(
    row: ShareAllocationPayload,
    memberName: string,
    hostedGuests: GuestAllocationPayload[],
  ) {
    return (
      <div className="space-y-3">
        <Button
          type="button"
          variant="default"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => addHostedGuest(row.memberId)}
        >
          + Thêm khách đi cùng
        </Button>
        <MobileEditorField label="Nước">
          <Input
            type="number"
            min={0}
            value={row.water}
            onChange={(event) =>
              updateRow(row.memberId, {
                water: Number(event.target.value) || 0,
              })
            }
            className="font-number text-right"
          />
        </MobileEditorField>
        <MobileEditorField label="Gửi xe">
          <Input
            type="number"
            min={0}
            value={row.parking}
            onChange={(event) =>
              updateRow(row.memberId, {
                parking: Number(event.target.value) || 0,
              })
            }
            className="font-number text-right"
          />
        </MobileEditorField>
        <MobileEditorField label="Khác">
          <Input
            type="number"
            min={0}
            value={row.extra}
            onChange={(event) =>
              updateRow(row.memberId, {
                extra: Number(event.target.value) || 0,
              })
            }
            className="font-number text-right"
          />
        </MobileEditorField>
        <MobileEditorField label="Ghi chú thêm">
          <Input
            value={row.extraNote ?? ""}
            placeholder="VD: Option"
            onChange={(event) =>
              updateRow(row.memberId, {
                extraNote: event.target.value || null,
              })
            }
          />
        </MobileEditorField>
        <MobileEditorField label="TV trả hộ">
          {hostedGuests.length > 0 ? (
            <label className="flex items-center gap-2">
              <Checkbox
                checked={row.memberPaysForGuests ?? false}
                onCheckedChange={(checked) =>
                  updateRow(row.memberId, {
                    memberPaysForGuests: checked === true,
                  })
                }
                aria-label={`Thành viên trả hộ khách của ${memberName}`}
              />
              <span className="text-sm">Thành viên trả hộ khách</span>
            </label>
          ) : (
            <span className="text-xs text-[var(--color-muted-foreground)]">—</span>
          )}
        </MobileEditorField>
        <MobileEditorField label="Tổng">
          <Input
            type="number"
            disabled
            min={0}
            value={row.amount ?? 0}
            className="font-number text-right"
          />
        </MobileEditorField>
      </div>
    );
  }

  function renderGuestEditorFields(
    guest: GuestAllocationPayload,
    options: {
      memberPaysForGuests?: boolean;
      paymentLabel: string;
    },
  ) {
    const disabled = options.memberPaysForGuests ?? false;

    return (
      <div className="space-y-3">
        <MobileEditorField label="Tên">
          <Input
            value={guest.name}
            placeholder={
              guest.hostedByMemberId
                ? "Tên khách (bạn, người nhà...)"
                : "Tên khách không phải thành viên"
            }
            onChange={(event) =>
              updateGuest(guest.clientId, { name: event.target.value })
            }
          />
        </MobileEditorField>
        <MobileEditorField label="Nước">
          <Input
            type="number"
            min={0}
            value={guest.water}
            disabled={disabled}
            onChange={(event) =>
              updateGuest(guest.clientId, {
                water: Number(event.target.value) || 0,
              })
            }
            className="font-number text-right"
          />
        </MobileEditorField>
        <MobileEditorField label="Gửi xe">
          <Input
            type="number"
            min={0}
            value={guest.parking}
            disabled={disabled}
            onChange={(event) =>
              updateGuest(guest.clientId, {
                parking: Number(event.target.value) || 0,
              })
            }
            className="font-number text-right"
          />
        </MobileEditorField>
        <MobileEditorField label="Khác">
          <Input
            type="number"
            min={0}
            value={guest.extra}
            disabled={disabled}
            onChange={(event) =>
              updateGuest(guest.clientId, {
                extra: Number(event.target.value) || 0,
              })
            }
            className="font-number text-right"
          />
        </MobileEditorField>
        <MobileEditorField label="Ghi chú">
          <Input
            value={guest.extraNote ?? ""}
            placeholder="Ghi chú"
            disabled={disabled}
            onChange={(event) =>
              updateGuest(guest.clientId, {
                extraNote: event.target.value || null,
              })
            }
          />
        </MobileEditorField>
        <MobileEditorField label="Thanh toán">
          <span className="text-xs text-[var(--color-muted-foreground)]">
            {options.paymentLabel}
          </span>
        </MobileEditorField>
        <MobileEditorField label="Tổng">
          <Input
            type="number"
            disabled
            min={0}
            value={guest.amount ?? 0}
            className="font-number text-right"
          />
        </MobileEditorField>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label required>Thành viên tham gia</Label>
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
          <div className="flex flex-wrap items-end justify-between gap-2">
            <Label>Chi phí theo người</Label>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Chia sân + cầu:{" "}
              <span className="font-number font-medium">
                {formatVND(sharedBasePerPerson)}
              </span>
              / người
              {totalAttendees > 0 && <> · {totalAttendees} người (gồm khách)</>}
            </p>
          </div>

          <div className="rounded-md border">
            <ResponsiveDataView
              mobile={
                <MobileDataList className="p-2">
                  {allocations.map((row) => {
                    const member = members.find(
                      (item) => item.id === row.memberId,
                    );
                    if (!member) return null;

                    const hostedGuests = guests.filter(
                      (guest) => guest.hostedByMemberId === row.memberId,
                    );

                    return (
                      <Fragment key={row.memberId}>
                        <MobileDataCard title={member.name}>
                          {renderMemberEditorFields(
                            row,
                            member.name,
                            hostedGuests,
                          )}
                        </MobileDataCard>

                        {hostedGuests.map((guest) => (
                          <MobileDataCard
                            key={guest.clientId}
                            subdued
                            title={`Khách của ${member.name}`}
                            actions={
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeGuest(guest.clientId)}
                              >
                                Xóa
                              </Button>
                            }
                          >
                            {renderGuestEditorFields(guest, {
                              memberPaysForGuests: row.memberPaysForGuests,
                              paymentLabel: row.memberPaysForGuests
                                ? "TV trả"
                                : "Trả trực tiếp",
                            })}
                          </MobileDataCard>
                        ))}
                      </Fragment>
                    );
                  })}

                  {standaloneGuests.map((guest) => (
                    <MobileDataCard
                      key={guest.clientId}
                      title="Khách không phải thành viên"
                      actions={
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeGuest(guest.clientId)}
                        >
                          Xóa
                        </Button>
                      }
                    >
                      {renderGuestEditorFields(guest, {
                        paymentLabel: "Trả trực tiếp",
                      })}
                    </MobileDataCard>
                  ))}
                </MobileDataList>
              }
              desktop={
                <Table minWidth="48rem">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Người</TableHead>
                      <TableHead className="text-right">Nước</TableHead>
                      <TableHead className="text-right">Gửi xe</TableHead>
                      <TableHead className="text-right">Khác</TableHead>
                      <TableHead>Ghi chú thêm</TableHead>
                      <TableHead className="text-center">TV trả hộ</TableHead>
                      <TableHead className="text-right">Tổng</TableHead>
                      <TableHead className="w-[4rem]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allocations.map((row) => {
                      const member = members.find(
                        (item) => item.id === row.memberId,
                      );
                      if (!member) return null;

                      const hostedGuests = guests.filter(
                        (guest) => guest.hostedByMemberId === row.memberId,
                      );

                      return (
                        <Fragment key={row.memberId}>
                          <TableRow>
                            <TableCell className="font-medium">
                              <div className="space-y-1 flex flex-col">
                                <span>{member.name}</span>
                                <Button
                                  type="button"
                                  variant="default"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => addHostedGuest(row.memberId)}
                                >
                                  + Thêm khách đi cùng
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min={0}
                                value={row.water}
                                onChange={(event) =>
                                  updateRow(row.memberId, {
                                    water: Number(event.target.value) || 0,
                                  })
                                }
                                className="font-number text-right"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min={0}
                                value={row.parking}
                                onChange={(event) =>
                                  updateRow(row.memberId, {
                                    parking: Number(event.target.value) || 0,
                                  })
                                }
                                className="font-number text-right"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min={0}
                                value={row.extra}
                                onChange={(event) =>
                                  updateRow(row.memberId, {
                                    extra: Number(event.target.value) || 0,
                                  })
                                }
                                className="font-number text-right"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={row.extraNote ?? ""}
                                placeholder="VD: Option"
                                onChange={(event) =>
                                  updateRow(row.memberId, {
                                    extraNote: event.target.value || null,
                                  })
                                }
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              {hostedGuests.length > 0 ? (
                                <Checkbox
                                  checked={row.memberPaysForGuests ?? false}
                                  onCheckedChange={(checked) =>
                                    updateRow(row.memberId, {
                                      memberPaysForGuests: checked === true,
                                    })
                                  }
                                  aria-label={`Thành viên trả hộ khách của ${member.name}`}
                                />
                              ) : (
                                <span className="text-xs text-[var(--color-muted-foreground)]">
                                  —
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                disabled
                                min={0}
                                value={row.amount ?? 0}
                                className="font-number text-right"
                              />
                            </TableCell>
                            <TableCell />
                          </TableRow>

                          {hostedGuests.map((guest) => (
                            <TableRow
                              key={guest.clientId}
                              className="bg-[var(--color-accent)]/40"
                            >
                              <TableCell className="pl-8">
                                <Input
                                  value={guest.name}
                                  placeholder="Tên khách (bạn, người nhà...)"
                                  onChange={(event) =>
                                    updateGuest(guest.clientId, {
                                      name: event.target.value,
                                    })
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min={0}
                                  value={guest.water}
                                  disabled={row.memberPaysForGuests}
                                  onChange={(event) =>
                                    updateGuest(guest.clientId, {
                                      water: Number(event.target.value) || 0,
                                    })
                                  }
                                  className="font-number text-right"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min={0}
                                  value={guest.parking}
                                  disabled={row.memberPaysForGuests}
                                  onChange={(event) =>
                                    updateGuest(guest.clientId, {
                                      parking: Number(event.target.value) || 0,
                                    })
                                  }
                                  className="font-number text-right"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min={0}
                                  value={guest.extra}
                                  disabled={row.memberPaysForGuests}
                                  onChange={(event) =>
                                    updateGuest(guest.clientId, {
                                      extra: Number(event.target.value) || 0,
                                    })
                                  }
                                  className="font-number text-right"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={guest.extraNote ?? ""}
                                  placeholder="Ghi chú"
                                  disabled={row.memberPaysForGuests}
                                  onChange={(event) =>
                                    updateGuest(guest.clientId, {
                                      extraNote: event.target.value || null,
                                    })
                                  }
                                />
                              </TableCell>
                              <TableCell className="text-center text-xs text-[var(--color-muted-foreground)]">
                                {row.memberPaysForGuests
                                  ? "TV trả"
                                  : "Trả trực tiếp"}
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  disabled
                                  min={0}
                                  value={guest.amount ?? 0}
                                  className="font-number text-right"
                                />
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeGuest(guest.clientId)}
                                >
                                  Xóa
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </Fragment>
                      );
                    })}

                    {standaloneGuests.map((guest) => (
                      <TableRow key={guest.clientId}>
                        <TableCell>
                          <Input
                            value={guest.name}
                            placeholder="Tên khách không phải thành viên"
                            onChange={(event) =>
                              updateGuest(guest.clientId, {
                                name: event.target.value,
                              })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            value={guest.water}
                            onChange={(event) =>
                              updateGuest(guest.clientId, {
                                water: Number(event.target.value) || 0,
                              })
                            }
                            className="font-number text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            value={guest.parking}
                            onChange={(event) =>
                              updateGuest(guest.clientId, {
                                parking: Number(event.target.value) || 0,
                              })
                            }
                            className="font-number text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            value={guest.extra}
                            onChange={(event) =>
                              updateGuest(guest.clientId, {
                                extra: Number(event.target.value) || 0,
                              })
                            }
                            className="font-number text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={guest.extraNote ?? ""}
                            placeholder="Ghi chú"
                            onChange={(event) =>
                              updateGuest(guest.clientId, {
                                extraNote: event.target.value || null,
                              })
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center text-xs text-[var(--color-muted-foreground)]">
                          Trả trực tiếp
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            disabled
                            min={0}
                            value={guest.amount ?? 0}
                            className="font-number text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeGuest(guest.clientId)}
                          >
                            Xóa
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              }
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addStandaloneGuest}
            >
              + Khách không phải thành viên
            </Button>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Khách luôn trả trực tiếp, không tính vào quỹ thành viên.
            </p>
          </div>

          <p className="text-sm text-[var(--color-muted-foreground)]">
            Tổng buổi đánh:{" "}
            <span className="font-number font-medium text-[var(--body)]">
              {formatVND(totalCost)}
            </span>
            {" · "}
            {totalAttendees} người tham gia
          </p>
        </div>
      )}

      <input
        type="hidden"
        name="shareAllocations"
        value={JSON.stringify(allocations)}
      />
      <input
        type="hidden"
        name="guestAllocations"
        value={JSON.stringify(guests)}
      />
    </div>
  );
}

export function buildInitialShareAllocations(
  shares: {
    memberId: string;
    amount: number;
    water?: number;
    parking?: number;
    extra?: number;
    extraNote?: string | null;
    memberPaysForGuests?: boolean;
  }[],
): ShareAllocationPayload[] {
  return shares.map((share) => ({
    memberId: share.memberId,
    water: share.water ?? 0,
    parking: share.parking ?? 0,
    extra: share.extra ?? 0,
    extraNote: share.extraNote ?? null,
    amount: share.amount,
    amountCustom: true,
    memberPaysForGuests: share.memberPaysForGuests ?? false,
  }));
}

export function buildInitialGuestAllocations(
  guests: {
    id: string;
    name: string;
    amount: number;
    water?: number;
    parking?: number;
    extra?: number;
    extraNote?: string | null;
    hostedByMemberId?: string | null;
  }[],
): GuestAllocationPayload[] {
  return guests.map((guest) => ({
    clientId: guest.id,
    name: guest.name,
    hostedByMemberId: guest.hostedByMemberId ?? null,
    water: guest.water ?? 0,
    parking: guest.parking ?? 0,
    extra: guest.extra ?? 0,
    extraNote: guest.extraNote ?? null,
    amount: guest.amount,
    amountCustom: true,
  }));
}
