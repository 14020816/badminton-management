"use server";

import { ClubRole } from "@prisma/client";
import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { calcFundSummary } from "@/lib/domain/ledger";

export type ClubAccess = {
  role: ClubRole;
  memberId: string | null;
  membershipId: string;
};

export type ClubViewContext = {
  mode: "member" | "guest";
  session: Session | null;
  access: ClubAccess | null;
};

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session;
}

export async function getMembership(
  clubId: string,
  userId: string,
): Promise<ClubAccess | null> {
  const membership = await db.clubMembership.findUnique({
    where: { clubId_userId: { clubId, userId } },
  });
  if (!membership) return null;
  return {
    role: membership.role,
    memberId: membership.memberId,
    membershipId: membership.id,
  };
}

export async function requireClubViewAccess(clubId: string) {
  const club = await db.club.findUnique({ where: { id: clubId } });
  if (!club) redirect("/");
  return club;
}

export async function getClubViewAccess(clubId: string): Promise<ClubViewContext> {
  const club = await db.club.findUnique({ where: { id: clubId } });
  if (!club) redirect("/");

  const session = await auth();
  if (session?.user?.id) {
    const access = await getMembership(clubId, session.user.id);
    if (access) {
      return { mode: "member", session, access };
    }
  }

  return { mode: "guest", session: session ?? null, access: null };
}

export async function requireClubMembership(clubId: string) {
  const session = await requireAuth();
  const access = await getMembership(clubId, session.user.id);
  if (!access) redirect(`/g/${clubId}`);
  return { session, access };
}

export async function requireClubAdmin(clubId: string) {
  const session = await auth();
  if (!session?.user?.id) redirect(`/g/${clubId}`);

  const access = await getMembership(clubId, session.user.id);
  if (!access) redirect(`/g/${clubId}`);
  if (access.role !== ClubRole.ADMIN) redirect(`/g/${clubId}`);
  return { session, access };
}

export async function resolveClubRole(clubId: string, userId: string) {
  return getMembership(clubId, userId);
}

export async function getUserClubs(userId: string) {
  const memberships = await db.clubMembership.findMany({
    where: { userId },
    include: {
      club: {
        include: {
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  const summaries = await Promise.all(
    memberships.map(async (m) => {
      const transactions = await db.transaction.findMany({
        where: { clubId: m.clubId, deletedAt: null },
        select: { type: true, amount: true, category: true, memberId: true },
      });
      const fundSummary = calcFundSummary(transactions);
      return {
        clubId: m.clubId,
        clubName: m.club.name,
        clubSlug: m.club.slug,
        role: m.role,
        memberCount: m.club._count.members,
        fundBalance: fundSummary.fundBalance,
      };
    }),
  );

  return summaries;
}

export async function getClubById(clubId: string) {
  return db.club.findUnique({ where: { id: clubId } });
}

export async function getUnlinkedMembers(clubId: string) {
  const linkedIds = (
    await db.clubMembership.findMany({
      where: { clubId, memberId: { not: null } },
      select: { memberId: true },
    })
  )
    .map((m) => m.memberId)
    .filter(Boolean) as string[];

  return db.member.findMany({
    where: {
      clubId,
      id: { notIn: linkedIds },
    },
    orderBy: { name: "asc" },
  });
}
