import type { Metadata } from "next";
import { requireClubAdmin } from "@/lib/club-context";
import { getSessionSchedules, getFulfilledScheduleSessions } from "@/actions/session-schedules";
import { getMembers, getShuttleTypes } from "@/lib/data/dashboard";
import { SessionsScheduledView } from "@/components/sessions/sessions-scheduled-view";

export const metadata: Metadata = {
  title: "Thêm cố định",
};

export default async function ClubSessionsSchedulePage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  await requireClubAdmin(clubId);

  const [sessionSchedules, members, shuttleTypes, fulfilled] = await Promise.all([
    getSessionSchedules(clubId),
    getMembers(clubId),
    getShuttleTypes(clubId),
    getFulfilledScheduleSessions(clubId),
  ]);

  const enabledSchedules = sessionSchedules.filter((schedule) => schedule.enabled);

  return (
    <SessionsScheduledView
      clubId={clubId}
      schedules={enabledSchedules}
      fulfilled={fulfilled}
      members={members}
      shuttleTypes={shuttleTypes.map((t) => ({
        id: t.id,
        name: t.name,
        pricePerBlock: t.pricePerBlock,
        shuttlesPerBlock: t.shuttlesPerBlock,
      }))}
    />
  );
}
