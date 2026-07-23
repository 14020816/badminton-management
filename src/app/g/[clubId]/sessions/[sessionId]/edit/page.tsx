import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireClubAdmin } from "@/lib/club-context";
import { getMembers, getShuttleTypes } from "@/lib/data/dashboard";
import { getSessionDetail } from "@/actions/sessions";
import { getFulfilledScheduleSessions } from "@/actions/session-schedules";
import { SessionFormView } from "@/components/sessions/session-form-view";
import {
  toEditableSession,
} from "@/components/sessions/session-form-types";
import { getFulfilledForSessionEdit } from "@/lib/domain/schedule";
import { buildSessionDetailPath } from "@/lib/sessions-list-filters";
import { formatSessionDate } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ clubId: string; sessionId: string }>;
}): Promise<Metadata> {
  const { clubId, sessionId } = await params;
  const session = await getSessionDetail(clubId, sessionId);

  return {
    title: session ? `Sửa · ${formatSessionDate(session.date)}` : "Sửa buổi đánh",
  };
}

export default async function ClubSessionEditPage({
  params,
}: {
  params: Promise<{ clubId: string; sessionId: string }>;
}) {
  const { clubId, sessionId } = await params;
  await requireClubAdmin(clubId);

  const [session, members, shuttleTypes, fulfilled] = await Promise.all([
    getSessionDetail(clubId, sessionId),
    getMembers(clubId),
    getShuttleTypes(clubId),
    getFulfilledScheduleSessions(clubId),
  ]);

  if (!session) notFound();

  const schedule = session.schedule
    ? {
        id: session.schedule.id,
        weekdays: session.schedule.weekdays,
        startTime: session.schedule.startTime,
        endTime: session.schedule.endTime,
      }
    : null;

  return (
    <SessionFormView
      clubId={clubId}
      members={members.map((member) => ({ id: member.id, name: member.name }))}
      shuttleTypes={shuttleTypes.map((type) => ({
        id: type.id,
        name: type.name,
        pricePerBlock: type.pricePerBlock,
        shuttlesPerBlock: type.shuttlesPerBlock,
      }))}
      mode="edit"
      session={toEditableSession(session)}
      cancelHref={buildSessionDetailPath(clubId, sessionId)}
      schedule={schedule}
      fulfilled={getFulfilledForSessionEdit(fulfilled, session)}
    />
  );
}
