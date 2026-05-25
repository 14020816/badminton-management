import { Suspense } from "react";
import { ClubRole } from "@prisma/client";
import { getClubViewAccess } from "@/lib/club-context";
import { getTournaments } from "@/actions/tournaments";
import { getMembers } from "@/lib/data/dashboard";
import { TournamentsView } from "@/components/tournaments/tournaments-view";
import { TablePageLoading } from "@/components/layout/page-loading";

async function TournamentsContent({ clubId }: { clubId: string }) {
  const { access } = await getClubViewAccess(clubId);
  const [tournaments, members] = await Promise.all([
    getTournaments(clubId),
    getMembers(clubId),
  ]);

  return (
    <TournamentsView
      clubId={clubId}
      tournaments={tournaments}
      members={members}
      isAdmin={access?.role === ClubRole.ADMIN}
    />
  );
}

export default async function ClubTournamentsPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;

  return (
    <Suspense fallback={<TablePageLoading />}>
      <TournamentsContent clubId={clubId} />
    </Suspense>
  );
}
