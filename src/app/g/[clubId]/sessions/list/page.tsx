import type { Metadata } from "next";
import { Suspense } from "react";
import { ClubRole } from "@prisma/client";
import { getClubViewAccess } from "@/lib/club-context";
import { getMembers, getShuttleTypes } from "@/lib/data/dashboard";
import { getSessionsPaginated } from "@/actions/sessions";
import { parseSessionListFilters } from "@/lib/sessions-list-filters";
import { SessionsListView } from "@/components/sessions/sessions-list-view";
import { TablePageLoading } from "@/components/layout/page-loading";

export const metadata: Metadata = {
  title: "Danh sách buổi đánh",
};

async function SessionsListContent({
  clubId,
  filters,
}: {
  clubId: string;
  filters: ReturnType<typeof parseSessionListFilters>;
}) {
  const { access } = await getClubViewAccess(clubId);

  const restrictToMemberId =
    access?.role === ClubRole.MEMBER ? access.memberId ?? undefined : undefined;

  const [result, members, shuttleTypes] = await Promise.all([
    getSessionsPaginated(clubId, filters, restrictToMemberId),
    getMembers(clubId),
    getShuttleTypes(clubId),
  ]);

  return (
    <SessionsListView
      clubId={clubId}
      sessions={result.sessions}
      filters={{ ...filters, page: result.page }}
      total={result.total}
      totalPages={result.totalPages}
      members={members.map((member) => ({ id: member.id, name: member.name }))}
      shuttleTypes={shuttleTypes.map((type) => ({
        id: type.id,
        name: type.name,
        pricePerBlock: type.pricePerBlock,
        shuttlesPerBlock: type.shuttlesPerBlock,
      }))}
      isAdmin={access?.role === ClubRole.ADMIN}
      showMemberFilter={access?.role !== ClubRole.MEMBER}
    />
  );
}

export default async function ClubSessionsListPage({
  params,
  searchParams,
}: {
  params: Promise<{ clubId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { clubId } = await params;
  const filters = parseSessionListFilters(await searchParams);

  return (
    <Suspense
      key={JSON.stringify(filters)}
      fallback={<TablePageLoading />}
    >
      <SessionsListContent clubId={clubId} filters={filters} />
    </Suspense>
  );
}
