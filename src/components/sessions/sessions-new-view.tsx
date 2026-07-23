"use client";

import { SessionFormView } from "@/components/sessions/session-form-view";

type Member = { id: string; name: string };
type ShuttleTypeOption = {
  id: string;
  name: string;
  pricePerBlock: number;
  shuttlesPerBlock: number;
};

export function SessionsNewView({
  clubId,
  members,
  shuttleTypes,
}: {
  clubId: string;
  members: Member[];
  shuttleTypes: ShuttleTypeOption[];
}) {
  return (
    <SessionFormView
      clubId={clubId}
      members={members}
      shuttleTypes={shuttleTypes}
      mode="create"
    />
  );
}
