import { ClubRole } from "@prisma/client";
import { getClubViewAccess } from "@/lib/club-context";
import { getParties } from "@/actions/parties";
import { getMembers } from "@/lib/data/dashboard";
import { PartiesView } from "@/components/parties/parties-view";

export default async function ClubPartiesPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  const { access } = await getClubViewAccess(clubId);
  const [parties, members] = await Promise.all([
    getParties(clubId),
    getMembers(clubId),
  ]);

  return (
    <PartiesView
      clubId={clubId}
      parties={parties}
      members={members}
      isAdmin={access?.role === ClubRole.ADMIN}
    />
  );
}
