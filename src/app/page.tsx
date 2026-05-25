import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAuth, getUserClubs } from "@/lib/club-context";
import { ClubsDashboard } from "@/components/clubs/clubs-dashboard";

export const metadata: Metadata = {
  title: "Tất cả nhóm",
};

export default async function HomePage() {
  const session = await requireAuth();
  const clubs = await getUserClubs(session.user.id);

  if (clubs.length === 1) {
    redirect(`/g/${clubs[0].clubId}`);
  }

  return <ClubsDashboard clubs={clubs} userName={session.user.name} />;
}
