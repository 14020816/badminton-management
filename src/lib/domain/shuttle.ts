export const DEFAULT_SHUTTLES_PER_BLOCK = 12;

export type ShuttleTypePricing = {
  pricePerBlock: number;
  shuttlesPerBlock: number;
};

export function calcPricePerShuttle(
  pricePerBlock: number,
  shuttlesPerBlock: number,
): number {
  if (shuttlesPerBlock <= 0) return 0;
  return pricePerBlock / shuttlesPerBlock;
}

export function calcShuttleCost(
  shuttlesUsed: number,
  pricing: ShuttleTypePricing,
): number {
  return Math.round(
    shuttlesUsed * calcPricePerShuttle(pricing.pricePerBlock, pricing.shuttlesPerBlock),
  );
}

export function legacyUnitPriceToBlock(
  pricePerUnit: number,
  shuttlesPerBlock = DEFAULT_SHUTTLES_PER_BLOCK,
): number {
  return pricePerUnit * shuttlesPerBlock;
}
