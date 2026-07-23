"use client";

import { Fragment, type ReactNode } from "react";
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
import { formatVND } from "@/lib/format";
import type { SessionParticipantsData } from "@/components/sessions/session-participants-types";
import { summarizeSessionParticipants, formatGuestDisplayName } from "@/components/sessions/session-participants-types";

function formatExtraAmount(value: number | undefined) {
  const amount = value ?? 0;
  return amount > 0 ? formatVND(amount) : "—";
}

function ExtraCell({ value }: { value: number | undefined }) {
  return (
    <TableCell className="font-number text-right">
      {formatExtraAmount(value)}
    </TableCell>
  );
}

function ParticipantFields({
  water,
  parking,
  extra,
  extraNote,
  payment,
  total,
}: {
  water: number | undefined;
  parking: number | undefined;
  extra: number | undefined;
  extraNote: string | null | undefined;
  payment: ReactNode;
  total: ReactNode;
}) {
  return (
    <MobileDataFields>
      <MobileDataField label="Nước" valueClassName="font-number text-right">
        {formatExtraAmount(water)}
      </MobileDataField>
      <MobileDataField label="Gửi xe" valueClassName="font-number text-right">
        {formatExtraAmount(parking)}
      </MobileDataField>
      <MobileDataField label="Khác" valueClassName="font-number text-right">
        {formatExtraAmount(extra)}
      </MobileDataField>
      <MobileDataField label="Tổng" valueClassName="font-number text-right font-medium">
        {total}
      </MobileDataField>
      <MobileDataField label="Ghi chú" fullWidth>
        {extraNote ?? "—"}
      </MobileDataField>
      <MobileDataField label="Thanh toán" fullWidth>
        {payment}
      </MobileDataField>
    </MobileDataFields>
  );
}

function ParticipantsMobileList({ session }: { session: SessionParticipantsData }) {
  const standaloneGuests = session.guests.filter(
    (guest) => !guest.hostedByMemberId,
  );

  return (
    <MobileDataList>
      {session.shares.map((share) => {
        const hostedGuests = session.guests.filter(
          (guest) => guest.hostedByMemberId === share.memberId,
        );

        return (
          <Fragment key={share.memberId}>
            <MobileDataCard
              title={
                <>
                  {share.member.name}
                  <span className="ml-1 text-xs font-normal text-[var(--color-muted-foreground)]">
                    (TV)
                  </span>
                </>
              }
            >
              <ParticipantFields
                water={share.water}
                parking={share.parking}
                extra={share.extra}
                extraNote={share.extraNote}
                payment={<Badge variant="default">Quỹ TV</Badge>}
                total={formatVND(share.amount)}
              />
            </MobileDataCard>

            {hostedGuests.map((guest) => (
              <MobileDataCard
                key={guest.id}
                subdued
                title={
                  <>
                    {formatGuestDisplayName(guest.name)}
                    <span className="ml-1 text-xs font-normal text-[var(--color-muted-foreground)]">
                      (khách)
                    </span>
                  </>
                }
              >
                <ParticipantFields
                  water={guest.water}
                  parking={guest.parking}
                  extra={guest.extra}
                  extraNote={guest.extraNote}
                  payment={
                    share.memberPaysForGuests ? (
                      <Badge variant="secondary">
                        TV trả hộ ({share.member.name})
                      </Badge>
                    ) : (
                      <Badge variant="outline">Trả trực tiếp</Badge>
                    )
                  }
                  total={guest.amount > 0 ? formatVND(guest.amount) : "—"}
                />
              </MobileDataCard>
            ))}
          </Fragment>
        );
      })}

      {standaloneGuests.map((guest) => (
        <MobileDataCard
          key={guest.id}
          title={
            <>
              {formatGuestDisplayName(guest.name)}
              <span className="ml-1 text-xs font-normal text-[var(--color-muted-foreground)]">
                (khách)
              </span>
            </>
          }
        >
          <ParticipantFields
            water={guest.water}
            parking={guest.parking}
            extra={guest.extra}
            extraNote={guest.extraNote}
            payment={<Badge variant="outline">Trả trực tiếp</Badge>}
            total={formatVND(guest.amount)}
          />
        </MobileDataCard>
      ))}
    </MobileDataList>
  );
}

function ParticipantsDesktopTable({ session }: { session: SessionParticipantsData }) {
  const standaloneGuests = session.guests.filter(
    (guest) => !guest.hostedByMemberId,
  );

  return (
    <Table minWidth="36rem">
      <TableHeader>
        <TableRow>
          <TableHead>Người</TableHead>
          <TableHead className="text-right">Nước</TableHead>
          <TableHead className="text-right">Gửi xe</TableHead>
          <TableHead className="text-right">Khác</TableHead>
          <TableHead>Ghi chú</TableHead>
          <TableHead>Thanh toán</TableHead>
          <TableHead className="text-right">Tổng</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {session.shares.map((share) => {
          const hostedGuests = session.guests.filter(
            (guest) => guest.hostedByMemberId === share.memberId,
          );

          return (
            <Fragment key={share.memberId}>
              <TableRow>
                <TableCell className="font-medium">
                  {share.member.name}
                  <span className="ml-1 text-xs font-normal text-[var(--color-muted-foreground)]">
                    (TV)
                  </span>
                </TableCell>
                <ExtraCell value={share.water} />
                <ExtraCell value={share.parking} />
                <ExtraCell value={share.extra} />
                <TableCell className="max-w-[8rem] truncate">
                  {share.extraNote ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge variant="default">Quỹ TV</Badge>
                </TableCell>
                <TableCell className="font-number text-right font-medium">
                  {formatVND(share.amount)}
                </TableCell>
              </TableRow>

              {hostedGuests.map((guest) => (
                <TableRow
                  key={guest.id}
                  className="bg-[var(--color-accent)]/40"
                >
                  <TableCell className="pl-8">
                    {formatGuestDisplayName(guest.name)}
                    <span className="ml-1 text-xs text-[var(--color-muted-foreground)]">
                      (khách)
                    </span>
                  </TableCell>
                  <ExtraCell value={guest.water} />
                  <ExtraCell value={guest.parking} />
                  <ExtraCell value={guest.extra} />
                  <TableCell className="max-w-[8rem] truncate">
                    {guest.extraNote ?? "—"}
                  </TableCell>
                  <TableCell>
                    {share.memberPaysForGuests ? (
                      <Badge variant="secondary">
                        TV trả hộ ({share.member.name})
                      </Badge>
                    ) : (
                      <Badge variant="outline">Trả trực tiếp</Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-number text-right">
                    {guest.amount > 0 ? formatVND(guest.amount) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </Fragment>
          );
        })}

        {standaloneGuests.map((guest) => (
          <TableRow key={guest.id}>
            <TableCell className="font-medium">
              {formatGuestDisplayName(guest.name)}
              <span className="ml-1 text-xs font-normal text-[var(--color-muted-foreground)]">
                (khách)
              </span>
            </TableCell>
            <ExtraCell value={guest.water} />
            <ExtraCell value={guest.parking} />
            <ExtraCell value={guest.extra} />
            <TableCell className="max-w-[8rem] truncate">
              {guest.extraNote ?? "—"}
            </TableCell>
            <TableCell>
              <Badge variant="outline">Trả trực tiếp</Badge>
            </TableCell>
            <TableCell className="font-number text-right font-medium">
              {formatVND(guest.amount)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function SessionParticipantsTable({
  session,
}: {
  session: SessionParticipantsData;
}) {
  return (
    <div className="rounded-md border">
      <ResponsiveDataView
        mobile={<ParticipantsMobileList session={session} />}
        desktop={<ParticipantsDesktopTable session={session} />}
      />
    </div>
  );
}

export function SessionParticipantsSummary({
  session,
}: {
  session: SessionParticipantsData;
}) {
  const { memberCount, guestCount, total } = summarizeSessionParticipants(session);

  return (
    <p className="text-sm text-[var(--color-muted-foreground)]">
      {total} người ({memberCount} thành viên
      {guestCount > 0 ? `, ${guestCount} khách` : ""}) · Tổng{" "}
      {formatVND(session.totalCost)}
    </p>
  );
}
