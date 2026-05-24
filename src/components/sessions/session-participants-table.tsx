"use client";

import { Fragment } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatVND } from "@/lib/format";
import type { SessionParticipantsData } from "@/components/sessions/session-participants-types";
import { summarizeSessionParticipants } from "@/components/sessions/session-participants-types";

function ExtraCell({ value }: { value: number | undefined }) {
  const amount = value ?? 0;
  return (
    <TableCell className="font-number text-right">
      {amount > 0 ? formatVND(amount) : "—"}
    </TableCell>
  );
}

export function SessionParticipantsTable({
  session,
}: {
  session: SessionParticipantsData;
}) {
  const standaloneGuests = session.guests.filter(
    (guest) => !guest.hostedByMemberId,
  );

  return (
    <div className="overflow-x-auto rounded-md border">
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
                      {guest.name}
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
                {guest.name}
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
