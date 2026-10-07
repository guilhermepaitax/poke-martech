import { RARITY_RANK, type Rarity } from "@/lib/value-objects/card";

type DrawEntry = {
  cardId: string;
  weight: number;
  rarity: Rarity;
};

type DrawFailure = "pool_too_small" | "featured_unavailable";

type DrawPackResult =
  | { ok: true; cardIds: string[] }
  | { ok: false; reason: DrawFailure };

function drawPack(input: {
  pool: DrawEntry[];
  count: number;
  featuredMinRarity: Rarity | null;
  random?: () => number;
}): DrawPackResult {
  const random = input.random ?? cryptoRandom;
  if (input.count < 1 || input.pool.length < input.count) {
    return { ok: false, reason: "pool_too_small" };
  }

  const remaining = input.pool.map((entry) => ({ ...entry }));
  const picked: string[] = [];
  const regularSlots = input.featuredMinRarity ? input.count - 1 : input.count;

  for (let slot = 0; slot < regularSlots; slot += 1) {
    const card = takeWeighted(remaining, random);
    if (!card) return { ok: false, reason: "pool_too_small" };
    picked.push(card.cardId);
  }

  if (input.featuredMinRarity) {
    const minimum = RARITY_RANK[input.featuredMinRarity];
    const featuredPool = remaining.filter(
      (entry) => RARITY_RANK[entry.rarity] >= minimum,
    );
    const card = takeWeighted(featuredPool, random);
    if (!card) return { ok: false, reason: "featured_unavailable" };
    picked.push(card.cardId);
  }

  return { ok: true, cardIds: picked };
}

function takeWeighted(pool: DrawEntry[], random: () => number): DrawEntry | null {
  const total = pool.reduce((sum, entry) => sum + Math.max(entry.weight, 0), 0);
  if (total <= 0 || pool.length === 0) return null;

  let roll = random() * total;
  let index = pool.length - 1;
  for (let i = 0; i < pool.length; i += 1) {
    roll -= Math.max(pool[i]?.weight ?? 0, 0);
    if (roll < 0) {
      index = i;
      break;
    }
  }

  const [picked] = pool.splice(index, 1);
  return picked ?? null;
}

function cryptoRandom() {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return (buffer[0] ?? 0) / 2 ** 32;
}

export { drawPack };
export type { DrawEntry, DrawFailure, DrawPackResult };
