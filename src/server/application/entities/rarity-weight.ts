import type { Rarity } from "@/lib/value-objects/card";

class RarityWeight {
  constructor(
    readonly rarity: Rarity,
    readonly weight: number,
  ) {}
}

export { RarityWeight };
