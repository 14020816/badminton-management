"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireClubAdmin, requireClubViewAccess } from "@/lib/club-context";
import { parseMemberGender, parseMemberRank } from "@/lib/domain/member";
import { loadMembersSettingsData } from "@/lib/data/members-settings";

function settingsPaths(clubId: string) {
  return [`/g/${clubId}/settings/members`, `/g/${clubId}/sessions`, `/g/${clubId}`];
}

export async function getMembersForSettings(clubId: string) {
  await requireClubViewAccess(clubId);
  return loadMembersSettingsData(clubId);
}

export async function createMemberAction(clubId: string, formData: FormData) {
  await requireClubAdmin(clubId);

  const name = String(formData.get("name") ?? "").trim();
  const rank = parseMemberRank(String(formData.get("rank") ?? ""));
  const gender = parseMemberGender(String(formData.get("gender") ?? ""));
  if (!name) throw new Error("Tên không được để trống");

  const existing = await db.member.findUnique({
    where: { clubId_name: { clubId, name } },
  });
  if (existing) throw new Error("Thành viên này đã tồn tại");

  await db.member.create({
    data: { clubId, name, rank, gender },
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
  const gender = parseMemberGender(String(formData.get("gender") ?? ""));
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
    data: { name, rank, gender },
  });

  settingsPaths(clubId).forEach((path) => revalidatePath(path));
}
