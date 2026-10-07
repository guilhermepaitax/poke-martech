import type { Finish, Rarity } from "@/lib/value-objects/card";
import type { BoosterCardInput } from "@/types/catalog";

class Booster {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly slug: string,
    readonly imageUrl: string | null,
    readonly description: string,
    readonly price: number,
    readonly cardsPerPack: number,
    readonly stock: number | null,
    readonly featuredSlotMinRarity: Rarity | null,
    readonly finish: Finish,
    readonly active: boolean,
    readonly cards: BoosterCardInput[],
  ) {}
}

export { Booster };
