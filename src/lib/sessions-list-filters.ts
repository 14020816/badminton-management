import type { CourtType } from "@prisma/client";
import { parseCourtType } from "@/lib/format";

export const SESSION_LIST_PAGE_SIZE = 15;

export type SessionListFilters = {
  courtType: CourtType | null;
  memberIds: string[];
  date: string | null;
  note: string | null;
  page: number;
};

export function parseSessionListFilters(
  searchParams: Record<string, string | string[] | undefined>,
): SessionListFilters {
  const courtType = parseCourtType(
    typeof searchParams.courtType === "string" ? searchParams.courtType : undefined,
  );

  const membersRaw = searchParams.members;
  const memberIds =
    typeof membersRaw === "string"
      ? membersRaw.split(",").map((id) => id.trim()).filter(Boolean)
      : Array.isArray(membersRaw)
        ? membersRaw.flatMap((value) => value.split(",")).map((id) => id.trim()).filter(Boolean)
        : [];

  const dateRaw = typeof searchParams.date === "string" ? searchParams.date.trim() : "";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateRaw) ? dateRaw : null;

  const noteRaw = typeof searchParams.note === "string" ? searchParams.note.trim() : "";
  const note = noteRaw || null;

  const pageRaw =
    typeof searchParams.page === "string" ? Number.parseInt(searchParams.page, 10) : 1;
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;

  return { courtType, memberIds, date, note, page };
}

export function sessionListDayBounds(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0);
  const dayEnd = new Date(year, month - 1, day, 23, 59, 59, 999);
  return { dayStart, dayEnd };
}

export function buildSessionListQuery(
  filters: Omit<SessionListFilters, "page"> & { page?: number },
): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.courtType) params.set("courtType", filters.courtType);
  if (filters.memberIds.length > 0) params.set("members", filters.memberIds.join(","));
  if (filters.date) params.set("date", filters.date);
  if (filters.note) params.set("note", filters.note);
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));

  return params;
}

export function buildSessionListPath(
  clubId: string,
  filters: Omit<SessionListFilters, "page"> & { page?: number },
): string {
  const query = buildSessionListQuery(filters).toString();
  return `/g/${clubId}/sessions/list${query ? `?${query}` : ""}`;
}

export function buildSessionDetailPath(clubId: string, sessionId: string): string {
  return `/g/${clubId}/sessions/${sessionId}`;
}

export function hasActiveSessionListFilters(
  filters: Omit<SessionListFilters, "page">,
): boolean {
  return Boolean(
    filters.courtType ||
      filters.memberIds.length > 0 ||
      filters.date ||
      filters.note,
  );
}
