"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireClubAdmin } from "@/lib/club-context";
import {
  parseShuttleTypeFormData,
  parseShuttleTypesPayload,
} from "@/lib/types/shuttle";

function shuttlePaths(clubId: string) {
  return [
    `/g/${clubId}/settings`,
    `/g/${clubId}/settings/shuttles`,
    `/g/${clubId}/sessions`,
    `/g/${clubId}/sessions/new`,
    `/g/${clubId}/sessions/schedule`,
  ];
}

async function ensureClubSettings(clubId: string) {
  await db.clubSettings.upsert({
    where: { clubId },
    create: { clubId },
    update: {},
  });
}

export async function createShuttleTypeAction(
  clubId: string,
  formData: FormData,
) {
  await requireClubAdmin(clubId);
  const row = parseShuttleTypeFormData(formData);
  await ensureClubSettings(clubId);

  const sortOrder = await db.shuttleType.count({ where: { clubId } });
  await db.shuttleType.create({
    data: {
      clubId,
      ...row,
      sortOrder,
    },
  });

  shuttlePaths(clubId).forEach((path) => revalidatePath(path));
}

export async function updateShuttleTypeAction(
  clubId: string,
  shuttleTypeId: string,
  formData: FormData,
) {
  await requireClubAdmin(clubId);
  const row = parseShuttleTypeFormData(formData);

  const existing = await db.shuttleType.findFirst({
    where: { id: shuttleTypeId, clubId },
  });
  if (!existing) throw new Error("Không tìm thấy loại cầu");

  await db.shuttleType.update({
    where: { id: shuttleTypeId },
    data: row,
  });

  shuttlePaths(clubId).forEach((path) => revalidatePath(path));
}

export async function deleteShuttleTypeAction(clubId: string, id: string) {
  await requireClubAdmin(clubId);

  const count = await db.shuttleType.count({ where: { clubId } });
  if (count <= 1) {
    throw new Error("Cần giữ ít nhất một loại cầu");
  }

  const existing = await db.shuttleType.findFirst({
    where: { id, clubId },
  });
  if (!existing) throw new Error("Không tìm thấy loại cầu");

  await db.shuttleType.delete({ where: { id } });
  shuttlePaths(clubId).forEach((path) => revalidatePath(path));
}

export async function updateClubSettingsAction(
  clubId: string,
  formData: FormData,
) {
  await requireClubAdmin(clubId);

  const types = parseShuttleTypesPayload(String(formData.get("shuttleTypes") ?? "[]"));

  await db.$transaction(async (tx) => {
    await tx.clubSettings.upsert({
      where: { clubId },
      create: { clubId },
      update: {},
    });

    const existing = await tx.shuttleType.findMany({
      where: { clubId },
      select: { id: true },
    });
    const keepIds = new Set(types.filter((t) => t.id).map((t) => t.id!));

    for (const row of existing) {
      if (!keepIds.has(row.id)) {
        await tx.shuttleType.delete({ where: { id: row.id } });
      }
    }

    for (let i = 0; i < types.length; i++) {
      const row = types[i];
      if (row.id) {
        await tx.shuttleType.update({
          where: { id: row.id, clubId },
          data: {
            name: row.name,
            pricePerBlock: row.pricePerBlock,
            shuttlesPerBlock: row.shuttlesPerBlock,
            inventory: row.inventory,
            sortOrder: i,
          },
        });
      } else {
        await tx.shuttleType.create({
          data: {
            clubId,
            name: row.name,
            pricePerBlock: row.pricePerBlock,
            shuttlesPerBlock: row.shuttlesPerBlock,
            inventory: row.inventory,
            sortOrder: i,
          },
        });
      }
    }
  });

  revalidatePath(`/g/${clubId}/settings`);
  revalidatePath(`/g/${clubId}/settings/shuttles`);
  revalidatePath(`/g/${clubId}/sessions`);
  revalidatePath(`/g/${clubId}/sessions/new`);
  revalidatePath(`/g/${clubId}/sessions/schedule`);
}
