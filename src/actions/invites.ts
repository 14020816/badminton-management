"use server";

import { ClubRole } from "@prisma/client";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  getUnlinkedMembers,
  requireAuth,
  requireClubAdmin,
} from "@/lib/club-context";

export async function getInviteByToken(token: string) {
  const invite = await db.clubInvite.findUnique({
    where: { token },
    include: { club: true },
  });
  if (!invite) return null;
  if (invite.expiresAt && invite.expiresAt < new Date()) return null;
  if (invite.maxUses != null && invite.useCount >= invite.maxUses) return null;
  return invite;
}

export async function createInviteAction(clubId: string) {
  const { session } = await requireClubAdmin(clubId);
  const token = randomUUID();

  await db.clubInvite.create({
    data: {
      clubId,
      token,
      createdById: session.user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  revalidatePath(`/g/${clubId}/settings`);
  return token;
}

export async function acceptInviteAction(token: string, formData: FormData) {
  const session = await requireAuth();
  const invite = await getInviteByToken(token);
  if (!invite) throw new Error("Lời mời không hợp lệ hoặc đã hết hạn");

  const existing = await db.clubMembership.findUnique({
    where: {
      clubId_userId: { clubId: invite.clubId, userId: session.user.id },
    },
  });
  if (existing) {
    redirect(`/g/${invite.clubId}`);
  }

  const mode = String(formData.get("mode") ?? "create");
  const displayName =
    String(formData.get("displayName") ?? "").trim() ||
    session.user.name ||
    session.user.email ||
    "Thành viên";

  let memberId: string | null = null;

  if (mode === "link") {
    memberId = String(formData.get("memberId") ?? "");
    const member = await db.member.findFirst({
      where: { id: memberId, clubId: invite.clubId },
    });
    if (!member) throw new Error("Thành viên không hợp lệ");

    const taken = await db.clubMembership.findFirst({
      where: { memberId },
    });
    if (taken) throw new Error("Thành viên này đã được liên kết");
  } else {
    const member = await db.member.create({
      data: {
        clubId: invite.clubId,
        name: displayName,
      },
    });
    memberId = member.id;
  }

  await db.$transaction([
    db.clubMembership.create({
      data: {
        clubId: invite.clubId,
        userId: session.user.id,
        role: ClubRole.MEMBER,
        memberId,
      },
    }),
    db.clubInvite.update({
      where: { id: invite.id },
      data: { useCount: { increment: 1 } },
    }),
  ]);

  redirect(`/g/${invite.clubId}`);
}

export async function getInviteJoinData(token: string) {
  const invite = await getInviteByToken(token);
  if (!invite) return null;

  const unlinkedMembers = await getUnlinkedMembers(invite.clubId);
  return {
    clubId: invite.clubId,
    clubName: invite.club.name,
    unlinkedMembers,
  };
}
