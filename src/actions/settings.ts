"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireClubAdmin } from "@/lib/club-context";
import { parseShuttleTypesPayload } from "@/lib/types/shuttle";

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
}
