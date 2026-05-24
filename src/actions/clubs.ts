"use server";

import { ClubRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAuth, requireClubAdmin } from "@/lib/club-context";
import { uniqueClubSlug } from "@/lib/club-utils";
import { defaultShuttleTypeRow } from "@/lib/types/shuttle";

export async function createClubAction(formData: FormData) {
  const session = await requireAuth();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Vui lòng nhập tên nhóm");

  const slug = await uniqueClubSlug(name);

  const club = await db.club.create({
    data: {
      name,
      slug,
      createdById: session.user.id,
      settings: { create: {} },
      shuttleTypes: {
        create: {
          ...defaultShuttleTypeRow(),
          sortOrder: 0,
        },
      },
      memberships: {
        create: {
          userId: session.user.id,
          role: ClubRole.ADMIN,
        },
      },
    },
  });

  revalidatePath("/");
  redirect(`/g/${club.id}`);
}

export async function updateClubNameAction(clubId: string, formData: FormData) {
  await requireClubAdmin(clubId);

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Vui lòng nhập tên nhóm");

  const club = await db.club.findUnique({ where: { id: clubId } });
  if (!club) throw new Error("Không tìm thấy nhóm");
  if (club.name === name) return;

  const slug = await uniqueClubSlug(name, clubId);

  await db.club.update({
    where: { id: clubId },
    data: { name, slug },
  });

  revalidatePath("/");
  revalidatePath(`/g/${clubId}`);
  revalidatePath(`/g/${clubId}/settings/info`);
}
