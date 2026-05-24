import { DEFAULT_SHUTTLES_PER_BLOCK } from "@/lib/domain/shuttle";

export type ShuttleTypeRow = {
  id?: string;
  name: string;
  pricePerBlock: number;
  shuttlesPerBlock: number;
  inventory: number;
};

export function defaultShuttleTypeRow(): ShuttleTypeRow {
  return {
    name: "Cầu thường",
    pricePerBlock: 294_000,
    shuttlesPerBlock: DEFAULT_SHUTTLES_PER_BLOCK,
    inventory: 0,
  };
}

export function parseShuttleTypesPayload(raw: string): ShuttleTypeRow[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Dữ liệu loại cầu không hợp lệ");
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Cần ít nhất một loại cầu");
  }

  return parsed.map((item, index) => {
    const row = item as Record<string, unknown>;
    const name = String(row.name ?? "").trim();
    const pricePerBlock = Number(row.pricePerBlock);
    const shuttlesPerBlock = Number(row.shuttlesPerBlock ?? DEFAULT_SHUTTLES_PER_BLOCK);
    const inventory = Number(row.inventory ?? 0);

    if (!name) throw new Error(`Loại cầu #${index + 1}: vui lòng nhập tên`);
    if (!Number.isFinite(pricePerBlock) || pricePerBlock < 0) {
      throw new Error(`Loại cầu "${name}": giá hộp không hợp lệ`);
    }
    if (!Number.isFinite(shuttlesPerBlock) || shuttlesPerBlock <= 0) {
      throw new Error(`Loại cầu "${name}": số quả/hộp phải lớn hơn 0`);
    }
    if (!Number.isFinite(inventory) || inventory < 0) {
      throw new Error(`Loại cầu "${name}": tồn kho không hợp lệ`);
    }

    return {
      id: row.id ? String(row.id) : undefined,
      name,
      pricePerBlock: Math.round(pricePerBlock),
      shuttlesPerBlock: Math.round(shuttlesPerBlock),
      inventory: Math.round(inventory),
    };
  });
}
