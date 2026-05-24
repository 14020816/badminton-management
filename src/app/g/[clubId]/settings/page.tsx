import { redirect } from "next/navigation";

export default async function ClubSettingsPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  redirect(`/g/${clubId}/settings/info`);
}
