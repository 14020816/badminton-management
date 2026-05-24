import { redirect } from "next/navigation";

export default async function ClubSessionsPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  redirect(`/g/${clubId}/sessions/list`);
}
