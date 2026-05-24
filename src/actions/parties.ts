"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireClubAdmin, requireClubViewAccess } from "@/lib/club-context";
import { parsePartyMemberAllocations } from "@/lib/domain/parties";

function parsePartyFormData(formData: FormData) {
  const dateRaw = String(formData.get("date") ?? "").trim();
  return {
    date: dateRaw ? new Date(dateRaw) : null,
    location: String(formData.get("location") ?? "").trim() || null,
    totalCost: Math.max(0, Math.round(Number(formData.get("totalCost") ?? 0))),
    note: String(formData.get("note") ?? "").trim() || null,
    members: parsePartyMemberAllocations(
      String(formData.get("memberAllocations") ?? "[]"),
    ),
  };
}

export async function createPartyAction(clubId: string, formData: FormData) {
  await requireClubAdmin(clubId);

  const { date, location, totalCost, note, members } =
    parsePartyFormData(formData);

  await db.party.create({
    data: {
      clubId,
      date,
      location,
      totalCost,
      note,
      members: {
        create: members.map((member) => ({
          memberId: member.memberId,
          amount: member.amount,
          countsToBudget: member.countsToBudget,
        })),
      },
    },
  });

  revalidatePath(`/g/${clubId}/parties`);
  revalidatePath(`/g/${clubId}`);
}

export async function updatePartyAction(clubId: string, formData: FormData) {
  await requireClubAdmin(clubId);

  const partyId = String(formData.get("partyId") ?? "");
  const party = await db.party.findFirst({
    where: { id: partyId, clubId },
    select: { id: true },
  });
  if (!party) throw new Error("Không tìm thấy liên hoan");

  const { date, location, totalCost, note, members } =
    parsePartyFormData(formData);

  await db.$transaction([
    db.partyMember.deleteMany({ where: { partyId } }),
    db.party.update({
      where: { id: partyId },
      data: {
        date,
        location,
        totalCost,
        note,
        members: {
          create: members.map((member) => ({
            memberId: member.memberId,
            amount: member.amount,
            countsToBudget: member.countsToBudget,
          })),
        },
      },
    }),
  ]);

  revalidatePath(`/g/${clubId}/parties`);
  revalidatePath(`/g/${clubId}`);
}

export async function deletePartyAction(clubId: string, formData: FormData) {
  await requireClubAdmin(clubId);

  const partyId = String(formData.get("partyId") ?? "");
  const party = await db.party.findFirst({
    where: { id: partyId, clubId },
    select: { id: true },
  });
  if (!party) throw new Error("Không tìm thấy liên hoan");

  await db.party.delete({ where: { id: partyId } });

  revalidatePath(`/g/${clubId}/parties`);
  revalidatePath(`/g/${clubId}`);
}

export async function getParties(clubId: string) {
  await requireClubViewAccess(clubId);
  return db.party.findMany({
    where: { clubId },
    include: { members: { include: { member: true } } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
}
