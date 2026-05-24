"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireClubAdmin, requireClubViewAccess } from "@/lib/club-context";
import { parseMemberRank } from "@/lib/domain/member";

function settingsPaths(clubId: string) {
  return [`/g/${clubId}/settings/members`, `/g/${clubId}/sessions`, `/g/${clubId}`];
}

export async function getMembersForSettings(clubId: string) {
  await requireClubViewAccess(clubId);
  return db.member.findMany({
    where: { clubId },
    include: {
      membership: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
    },
    orderBy: [{ rank: { sort: "asc", nulls: "last" } }, { name: "asc" }],
  });
}

export async function createMemberAction(clubId: string, formData: FormData) {
  await requireClubAdmin(clubId);

  const name = String(formData.get("name") ?? "").trim();
  const rank = parseMemberRank(String(formData.get("rank") ?? ""));
  if (!name) throw new Error("Tên không được để trống");

  const existing = await db.member.findUnique({
    where: { clubId_name: { clubId, name } },
  });
  if (existing) throw new Error("Thành viên này đã tồn tại");

  await db.member.create({
    data: { clubId, name, rank },
  });

  settingsPaths(clubId).forEach((path) => revalidatePath(path));
}

export async function updateMemberAction(
  clubId: string,
  memberId: string,
  formData: FormData,
) {
  await requireClubAdmin(clubId);

  const name = String(formData.get("name") ?? "").trim();
  const rank = parseMemberRank(String(formData.get("rank") ?? ""));
  if (!name) throw new Error("Tên không được để trống");

  const member = await db.member.findFirst({
    where: { id: memberId, clubId },
  });
  if (!member) throw new Error("Không tìm thấy thành viên");

  const duplicate = await db.member.findFirst({
    where: { clubId, name, id: { not: memberId } },
  });
  if (duplicate) throw new Error("Thành viên này đã tồn tại");

  await db.member.update({
    where: { id: memberId },
    data: { name, rank },
  });

  settingsPaths(clubId).forEach((path) => revalidatePath(path));
}
