import { requireClubAdmin } from "@/lib/club-context";

export default async function ClubSettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  await requireClubAdmin(clubId);

  return <div className="space-y-6">{children}</div>;
}
