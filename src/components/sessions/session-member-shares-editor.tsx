"use client";

import {
  Fragment,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
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
  calcGuestBaseShare,
  calcMemberBaseShare,
  calcSessionAllocations,
  calcSessionPerPersonCosts,
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

function patchAffectsMemberAmount(patch: Partial<ShareAllocationPayload>) {
  return (
    "water" in patch ||
    "parking" in patch ||
    "extra" in patch ||
    "paysShuttleCost" in patch ||
    "memberPaysForGuests" in patch
  );
}

function patchAffectsGuestAmount(patch: Partial<GuestAllocationPayload>) {
  return "water" in patch || "parking" in patch || "extra" in patch;
}

function toMemberInputs(allocations: ShareAllocationPayload[]) {
  return allocations.map((row) => ({
    memberId: row.memberId,
    memberPaysForGuests: row.memberPaysForGuests,
    paysShuttleCost: row.paysShuttleCost,
    water: row.water,
    parking: row.parking,
    extra: row.extra,
    extraNote: row.extraNote,
    amount: row.amountCustom ? row.amount : null,
  }));
}

function toGuestInputs(guests: GuestAllocationPayload[]) {
  return guests.map((guest) => ({
    name: guest.name,
    hostedByMemberId: guest.hostedByMemberId,
    water: guest.water,
    parking: guest.parking,
    extra: guest.extra,
    extraNote: guest.extraNote,
    amount: guest.amountCustom ? guest.amount : null,
  }));
}

function calcMemberDefaultAmount(
  perPerson: ReturnType<typeof calcSessionPerPersonCosts>,
  row: ShareAllocationPayload,
  guests: GuestAllocationPayload[],
): number {
  const hostedGuests = guests.filter(
    (guest) => guest.hostedByMemberId === row.memberId,
  );
  let amount = defaultShareAmount(
    calcMemberBaseShare(perPerson, row.paysShuttleCost !== false),
    row,
  );

  if (row.memberPaysForGuests) {
    amount += calcGuestBaseShare(perPerson) * hostedGuests.length;
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
  perPerson: ReturnType<typeof calcSessionPerPersonCosts>,
  guest: GuestAllocationPayload,
  members: ShareAllocationPayload[],
): number {
  if (!guest.hostedByMemberId) {
    return defaultShareAmount(calcGuestBaseShare(perPerson), guest);
  }

  const host = members.find(
    (member) => member.memberId === guest.hostedByMemberId,
  );
  if (host?.memberPaysForGuests) {
    return 0;
  }

  return defaultShareAmount(calcGuestBaseShare(perPerson), guest);
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
  const [costTableOpen, setCostTableOpen] = useState(false);
  const costInput = useMemo(
    () => ({
      courtRental,
      shuttlesUsed,
      shuttlePricing,
    }),
    [courtRental, shuttlesUsed, shuttlePricing],
  );

  const totalAttendees = attendeeCount(allocations, guests);

  const perPerson = useMemo(
    () =>
      calcSessionPerPersonCosts(
        costInput,
        toMemberInputs(allocations),
        toGuestInputs(guests),
      ),
    [allocations, costInput, guests],
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
        const amount = calcMemberDefaultAmount(perPerson, row, guests);
        if (amount === row.amount) return row;
        changed = true;
        return { ...row, amount };
      });

      return changed ? next : current;
    });
  }, [guests, onChange, perPerson]);

  useEffect(() => {
    onGuestsChange((current) => {
      if (current.length === 0) return current;

      let changed = false;
      const next = current.map((guest) => {
        if (guest.amountCustom) return guest;
        const amount = calcGuestDefaultAmount(perPerson, guest, allocations);
        if (amount === guest.amount) return guest;
        changed = true;
        return { ...guest, amount };
      });

      return changed ? next : current;
    });
  }, [allocations, onGuestsChange, perPerson]);

  const preview = useMemo(
    () =>
      calcSessionAllocations(
        costInput,
        toMemberInputs(allocations),
        toGuestInputs(guests),
      ),
    [allocations, costInput, guests],
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

      const nextAllocations: ShareAllocationPayload[] = [
        ...current,
        {
          memberId,
          water: 0,
          parking: 0,
          extra: 0,
          extraNote: null,
          amount: 0,
          amountCustom: false,
          memberPaysForGuests: false,
          paysShuttleCost: true,
        },
      ];
      const nextPerPerson = calcSessionPerPersonCosts(
        costInput,
        toMemberInputs(nextAllocations),
        toGuestInputs(guests),
      );
      const nextRow = nextAllocations[nextAllocations.length - 1]!;
      nextRow.amount = calcMemberDefaultAmount(nextPerPerson, nextRow, guests);
      return nextAllocations;
    });
  }

  function updateRow(memberId: string, patch: Partial<ShareAllocationPayload>) {
    onChange((current) => {
      const nextMembers = current.map((row) => {
        if (row.memberId !== memberId) return row;
        const updated = { ...row, ...patch };
        if (patchAffectsMemberAmount(patch)) {
          updated.amountCustom = false;
        }
        if (!updated.amountCustom) {
          updated.amount = calcMemberDefaultAmount(perPerson, updated, guests);
        }
        return updated;
      });

      if ("memberPaysForGuests" in patch || "paysShuttleCost" in patch) {
        onGuestsChange((currentGuests) =>
          currentGuests.map((guest) => {
            if (guest.hostedByMemberId !== memberId) return guest;
            const updatedGuest = { ...guest, amountCustom: false };
            updatedGuest.amount = calcGuestDefaultAmount(
              perPerson,
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
        amount: calcGuestBaseShare(perPerson),
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
        amount: calcGuestBaseShare(perPerson),
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
        if (patchAffectsGuestAmount(patch)) {
          updated.amountCustom = false;
        }
        if (!updated.amountCustom) {
          updated.amount = calcGuestDefaultAmount(
            perPerson,
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
          <CurrencyInput
            value={row.water}
            onValueChange={(water) => updateRow(row.memberId, { water })}
          />
        </MobileEditorField>
        <MobileEditorField label="Gửi xe">
          <CurrencyInput
            value={row.parking}
            onValueChange={(parking) => updateRow(row.memberId, { parking })}
          />
        </MobileEditorField>
        <MobileEditorField label="Khác">
          <CurrencyInput
            value={row.extra}
            onValueChange={(extra) => updateRow(row.memberId, { extra })}
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
        <MobileEditorField label="Không chia cầu">
          <label className="flex items-center gap-2">
            <Checkbox
              checked={row.paysShuttleCost === false}
              onCheckedChange={(checked) =>
                updateRow(row.memberId, {
                  paysShuttleCost: checked !== true,
                })
              }
              aria-label={`${memberName} không chia cầu`}
            />
            <span className="text-sm">Chỉ chia tiền sân</span>
          </label>
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
          <CurrencyInput
            disabled
            value={row.amount ?? 0}
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
                ? "Tên khách (tuỳ chọn)"
                : "Tên khách (tuỳ chọn)"
            }
            onChange={(event) =>
              updateGuest(guest.clientId, { name: event.target.value })
            }
          />
        </MobileEditorField>
        <MobileEditorField label="Nước">
          <CurrencyInput
            value={guest.water}
            disabled={disabled}
            onValueChange={(water) =>
              updateGuest(guest.clientId, { water })
            }
          />
        </MobileEditorField>
        <MobileEditorField label="Gửi xe">
          <CurrencyInput
            value={guest.parking}
            disabled={disabled}
            onValueChange={(parking) =>
              updateGuest(guest.clientId, { parking })
            }
          />
        </MobileEditorField>
        <MobileEditorField label="Khác">
          <CurrencyInput
            value={guest.extra}
            disabled={disabled}
            onValueChange={(extra) =>
              updateGuest(guest.clientId, { extra })
            }
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
          <CurrencyInput disabled value={guest.amount ?? 0} />
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
            <button
              type="button"
              className="flex items-center gap-1.5 text-left"
              aria-expanded={costTableOpen}
              onClick={() => setCostTableOpen((open) => !open)}
            >
              {costTableOpen ? (
                <ChevronDown className="size-4 shrink-0 text-[var(--color-muted-foreground)]" />
              ) : (
                <ChevronRight className="size-4 shrink-0 text-[var(--color-muted-foreground)]" />
              )}
              <Label className="cursor-pointer">Chi phí theo người</Label>
            </button>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Chia sân:{" "}
              <span className="font-number font-medium">
                {formatVND(perPerson.courtPerPerson)}
              </span>
              / người · Chia cầu:{" "}
              <span className="font-number font-medium">
                {formatVND(perPerson.shuttlePerPerson)}
              </span>
              / người ({perPerson.shuttlePayers} người)
              {totalAttendees > 0 && <> · {totalAttendees} người tham gia</>}
            </p>
          </div>

          {costTableOpen && (
            <>
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
                      <TableHead className="text-center">Chia cầu</TableHead>
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
                              <CurrencyInput
                                value={row.water}
                                onValueChange={(water) =>
                                  updateRow(row.memberId, { water })
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <CurrencyInput
                                value={row.parking}
                                onValueChange={(parking) =>
                                  updateRow(row.memberId, { parking })
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <CurrencyInput
                                value={row.extra}
                                onValueChange={(extra) =>
                                  updateRow(row.memberId, { extra })
                                }
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
                              <label className="inline-flex items-center gap-1">
                                <Checkbox
                                  checked={row.paysShuttleCost !== false}
                                  onCheckedChange={(checked) =>
                                    updateRow(row.memberId, {
                                      paysShuttleCost: checked === true,
                                    })
                                  }
                                  aria-label={`${member.name} chia cầu`}
                                />
                              </label>
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
                              <CurrencyInput
                                disabled
                                value={row.amount ?? 0}
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
                                  placeholder="Tên khách (tuỳ chọn)"
                                  onChange={(event) =>
                                    updateGuest(guest.clientId, {
                                      name: event.target.value,
                                    })
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <CurrencyInput
                                  value={guest.water}
                                  disabled={row.memberPaysForGuests}
                                  onValueChange={(water) =>
                                    updateGuest(guest.clientId, { water })
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <CurrencyInput
                                  value={guest.parking}
                                  disabled={row.memberPaysForGuests}
                                  onValueChange={(parking) =>
                                    updateGuest(guest.clientId, { parking })
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <CurrencyInput
                                  value={guest.extra}
                                  disabled={row.memberPaysForGuests}
                                  onValueChange={(extra) =>
                                    updateGuest(guest.clientId, { extra })
                                  }
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
                                —
                              </TableCell>
                              <TableCell className="text-center text-xs text-[var(--color-muted-foreground)]">
                                {row.memberPaysForGuests
                                  ? "TV trả"
                                  : "Trả trực tiếp"}
                              </TableCell>
                              <TableCell>
                                <CurrencyInput
                                  disabled
                                  value={guest.amount ?? 0}
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
                            placeholder="Tên khách (tuỳ chọn)"
                            onChange={(event) =>
                              updateGuest(guest.clientId, {
                                name: event.target.value,
                              })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <CurrencyInput
                            value={guest.water}
                            onValueChange={(water) =>
                              updateGuest(guest.clientId, { water })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <CurrencyInput
                            value={guest.parking}
                            onValueChange={(parking) =>
                              updateGuest(guest.clientId, { parking })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <CurrencyInput
                            value={guest.extra}
                            onValueChange={(extra) =>
                              updateGuest(guest.clientId, { extra })
                            }
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
                          —
                        </TableCell>
                        <TableCell className="text-center text-xs text-[var(--color-muted-foreground)]">
                          Trả trực tiếp
                        </TableCell>
                        <TableCell>
                          <CurrencyInput disabled value={guest.amount ?? 0} />
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
            </>
          )}

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
    paysShuttleCost?: boolean;
  }[],
): ShareAllocationPayload[] {
  return shares.map((share) => ({
    memberId: share.memberId,
    water: share.water ?? 0,
    parking: share.parking ?? 0,
    extra: share.extra ?? 0,
    extraNote: share.extraNote ?? null,
    amount: share.amount,
    amountCustom: false,
    memberPaysForGuests: share.memberPaysForGuests ?? false,
    paysShuttleCost: share.paysShuttleCost ?? true,
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
    amountCustom: false,
  }));
}
