import type { Metadata } from "next";
import { ClubRole } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import { getClubViewAccess, requireClubViewAccess } from "@/lib/club-context";
import { getMemberHistory, parseMemberHistorySearchParams } from "@/lib/data/member-history";
import { MemberHistoryView } from "@/components/members/member-history-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ clubId: string; memberId: string }>;
}): Promise<Metadata> {
  const { clubId, memberId } = await params;
  const data = await getMemberHistory(clubId, memberId, { sessionPage: 1 });

  return {
    title: data?.member.name ?? "Thành viên",
  };
}

export default async function MemberHistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ clubId: string; memberId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { clubId, memberId } = await params;
  const { sessionPage } = parseMemberHistorySearchParams(await searchParams);
  await requireClubViewAccess(clubId);
  const { access } = await getClubViewAccess(clubId);

  if (access?.role === ClubRole.MEMBER) {
    if (!access.memberId) redirect(`/g/${clubId}`);
    if (access.memberId !== memberId) {
      redirect(`/g/${clubId}/members/${access.memberId}`);
    }
  }

  const data = await getMemberHistory(clubId, memberId, { sessionPage });
  if (!data) notFound();

  return <MemberHistoryView clubId={clubId} memberId={memberId} {...data} />;
}
