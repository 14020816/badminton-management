import { requireClubAdmin } from "@/lib/club-context";
import { getMembers, getShuttleTypes } from "@/lib/data/dashboard";
import { SessionsNewView } from "@/components/sessions/sessions-new-view";

export default async function ClubSessionsNewPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  await requireClubAdmin(clubId);
  const [members, shuttleTypes] = await Promise.all([
    getMembers(clubId),
    getShuttleTypes(clubId),
  ]);

  return (
    <SessionsNewView
      clubId={clubId}
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
