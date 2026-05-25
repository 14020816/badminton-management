import type { Metadata } from "next";
import { requireAuth } from "@/lib/club-context";
import { CreateClubForm } from "@/components/clubs/create-club-form";

export const metadata: Metadata = {
  title: "Tạo nhóm",
};

export default async function NewClubPage() {
  const session = await requireAuth();
  return <CreateClubForm userName={session.user.name} />;
}
