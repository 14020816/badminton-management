"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireClubAdmin, requireClubViewAccess } from "@/lib/club-context";

function clubPaths(clubId: string) {
  return [`/g/${clubId}/transactions`, `/g/${clubId}`, `/g/${clubId}/parties`];
}

export async function createExpenseAction(clubId: string, formData: FormData) {
  await requireClubAdmin(clubId);

  const dateRaw = String(formData.get("date") ?? "");
  await db.transaction.create({
    data: {
      clubId,
      type: "EXPENSE",
      date: dateRaw ? new Date(dateRaw) : null,
      amount: Number(formData.get("amount") ?? 0),
      category: String(formData.get("category") ?? "OPTION"),
      description: String(formData.get("description") ?? "") || null,
      quantity: formData.get("quantity")
        ? Number(formData.get("quantity"))
        : null,
    },
  });

  clubPaths(clubId).forEach((p) => revalidatePath(p));
}

export async function createIncomeAction(clubId: string, formData: FormData) {
  await requireClubAdmin(clubId);

  await db.transaction.create({
    data: {
      clubId,
      type: "INCOME",
      date: new Date(String(formData.get("date"))),
      amount: Number(formData.get("amount") ?? 0),
      category: String(formData.get("category") ?? "FUND_CONTRIBUTION"),
      memberId: String(formData.get("memberId")),
      note: String(formData.get("note") ?? "") || null,
    },
  });

  clubPaths(clubId).forEach((p) => revalidatePath(p));
}

export async function updateExpenseAction(
  clubId: string,
  id: string,
  formData: FormData,
) {
  await requireClubAdmin(clubId);

  const tx = await db.transaction.findFirst({
    where: { id, clubId, type: "EXPENSE", deletedAt: null },
  });
  if (!tx) throw new Error("Không tìm thấy giao dịch");

  const dateRaw = String(formData.get("date") ?? "");
  await db.transaction.update({
    where: { id },
    data: {
      date: dateRaw ? new Date(dateRaw) : null,
      amount: Number(formData.get("amount") ?? 0),
      category: String(formData.get("category") ?? "OPTION"),
      description: String(formData.get("description") ?? "") || null,
      quantity: formData.get("quantity")
        ? Number(formData.get("quantity"))
        : null,
    },
  });

  clubPaths(clubId).forEach((p) => revalidatePath(p));
}

export async function updateIncomeAction(
  clubId: string,
  id: string,
  formData: FormData,
) {
  await requireClubAdmin(clubId);

  const tx = await db.transaction.findFirst({
    where: { id, clubId, type: "INCOME", deletedAt: null },
  });
  if (!tx) throw new Error("Không tìm thấy giao dịch");

  await db.transaction.update({
    where: { id },
    data: {
      date: new Date(String(formData.get("date"))),
      amount: Number(formData.get("amount") ?? 0),
      category: String(formData.get("category") ?? "FUND_CONTRIBUTION"),
      memberId: String(formData.get("memberId")),
      note: String(formData.get("note") ?? "") || null,
    },
  });

  clubPaths(clubId).forEach((p) => revalidatePath(p));
}

export async function deleteTransactionAction(clubId: string, id: string) {
  await requireClubAdmin(clubId);
  const tx = await db.transaction.findFirst({ where: { id, clubId } });
  if (!tx) throw new Error("Không tìm thấy giao dịch");

  await db.transaction.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  clubPaths(clubId).forEach((p) => revalidatePath(p));
}

export async function getTransactions(
  clubId: string,
  type?: "EXPENSE" | "INCOME",
) {
  await requireClubViewAccess(clubId);
  return db.transaction.findMany({
    where: {
      clubId,
      deletedAt: null,
      ...(type ? { type } : {}),
    },
    include: { member: true },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
}

export async function transferPartySurplusAction(
  clubId: string,
  formData: FormData,
) {
  await requireClubAdmin(clubId);

  await db.transaction.create({
    data: {
      clubId,
      type: "INCOME",
      date: new Date(),
      amount: Number(formData.get("amount") ?? 0),
      category: "FUND_CONTRIBUTION",
      memberId: String(formData.get("memberId")),
      note: String(formData.get("note") ?? "Chuyển tiền dư liên hoan vào quỹ cầu"),
    },
  });

  clubPaths(clubId).forEach((p) => revalidatePath(p));
}
