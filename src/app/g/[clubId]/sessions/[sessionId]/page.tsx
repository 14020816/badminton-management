import type { Metadata } from "next";
import { Suspense } from "react";
import { ClubRole } from "@prisma/client";
import { notFound } from "next/navigation";
import { getClubViewAccess } from "@/lib/club-context";
import { getMembers, getShuttleTypes } from "@/lib/data/dashboard";
import { getSessionDetail } from "@/actions/sessions";
import { buildSessionListPath } from "@/lib/sessions-list-filters";
import { SessionDetailView } from "@/components/sessions/session-detail-view";
import { FormPageLoading } from "@/components/layout/page-loading";
import { formatSessionDate } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ clubId: string; sessionId: string }>;
}): Promise<Metadata> {
  const { clubId, sessionId } = await params;
  const session = await getSessionDetail(clubId, sessionId);

  return {
    title: session ? formatSessionDate(session.date) : "Buổi đánh",
  };
}

async function SessionDetailContent({
  clubId,
  sessionId,
}: {
  clubId: string;
  sessionId: string;
}) {
  const { access } = await getClubViewAccess(clubId);

  const restrictToMemberId =
    access?.role === ClubRole.MEMBER ? access.memberId ?? undefined : undefined;

  const [session, members, shuttleTypes] = await Promise.all([
    getSessionDetail(clubId, sessionId, restrictToMemberId),
    getMembers(clubId),
    getShuttleTypes(clubId),
  ]);

  if (!session) notFound();

  return (
    <SessionDetailView
      clubId={clubId}
      session={session}
      members={members.map((member) => ({ id: member.id, name: member.name }))}
      shuttleTypes={shuttleTypes.map((type) => ({
        id: type.id,
        name: type.name,
        pricePerBlock: type.pricePerBlock,
        shuttlesPerBlock: type.shuttlesPerBlock,
      }))}
      isAdmin={access?.role === ClubRole.ADMIN}
      backHref={buildSessionListPath(clubId, {
        courtType: null,
        memberIds: [],
        date: null,
        note: null,
      })}
    />
  );
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ clubId: string; sessionId: string }>;
}) {
  const { clubId, sessionId } = await params;

  return (
    <Suspense fallback={<FormPageLoading />}>
      <SessionDetailContent clubId={clubId} sessionId={sessionId} />
    </Suspense>
  );
}
