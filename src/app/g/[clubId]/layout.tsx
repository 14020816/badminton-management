import type { Metadata } from "next";
import { ClubRole } from "@prisma/client";
import {
  getClubViewAccess,
  getUserClubs,
  getClubById,
} from "@/lib/club-context";
import { ClubShell } from "@/components/layout/club-shell";
import {
  clubDefaultTitle,
  clubTitleTemplate,
} from "@/lib/site-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ clubId: string }>;
}): Promise<Metadata> {
  const { clubId } = await params;
  const club = await getClubById(clubId);
  const clubName = club?.name ?? "Nhóm";

  return {
    title: {
      template: clubTitleTemplate(clubName),
      default: clubDefaultTitle(clubName),
    },
  };
}

export default async function ClubLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  const view = await getClubViewAccess(clubId);
  const club = await getClubById(clubId);

  if (!club) {
    return null;
  }

  const isGuest = view.mode === "guest";
  const clubs =
    !isGuest && view.session?.user?.id
      ? await getUserClubs(view.session.user.id)
      : [];

  return (
    <ClubShell
      clubId={clubId}
      clubName={club.name}
      role={view.access?.role ?? ClubRole.MEMBER}
      userName={view.session?.user?.name}
      userClubs={clubs.map((c) => ({
        clubId: c.clubId,
        clubName: c.clubName,
      }))}
      readonly={isGuest}
      loginHref={isGuest ? `/login?callbackUrl=${encodeURIComponent(`/g/${clubId}`)}` : undefined}
    >
      {children}
    </ClubShell>
  );
}
