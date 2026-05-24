import { db } from "@/lib/db";

export function slugifyClubName(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return base || "club";
}

export async function uniqueClubSlug(
  name: string,
  excludeClubId?: string,
): Promise<string> {
  const base = slugifyClubName(name);
  let slug = base;
  let n = 1;
  while (true) {
    const existing = await db.club.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeClubId) break;
    slug = `${base}-${n++}`;
  }
  return slug;
}
