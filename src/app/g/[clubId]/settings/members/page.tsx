import type { Metadata } from "next";
import { getMembersForSettings } from "@/actions/members";
import { ClubMembersSettings } from "@/components/clubs/club-members-settings";

export const metadata: Metadata = {
  title: "Thành viên",
};

export default async function ClubSettingsMembersPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  const members = await getMembersForSettings(clubId);

  return <ClubMembersSettings clubId={clubId} members={members} />;
}
