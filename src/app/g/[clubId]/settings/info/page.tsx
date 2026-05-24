import { getClubById } from "@/lib/club-context";
import { ClubInfoSettings } from "@/components/clubs/club-info-settings";

export default async function ClubSettingsInfoPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  const club = await getClubById(clubId);

  return (
    <ClubInfoSettings clubId={clubId} clubName={club?.name ?? "Nhóm"} />
  );
}
