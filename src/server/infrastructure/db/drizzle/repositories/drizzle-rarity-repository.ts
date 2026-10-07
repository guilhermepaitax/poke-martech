import { isRarity } from "@/lib/value-objects/card";
import type { RarityRepository } from "@/server/application/contracts/repositories/rarity-repository";
import { RarityWeight } from "@/server/application/entities/rarity-weight";
import { db } from "@/server/infrastructure/db/drizzle/client";
import { rarityWeights } from "@/server/infrastructure/db/drizzle/schema";

class DrizzleRarityRepository implements RarityRepository {
  async list(): Promise<RarityWeight[]> {
    const rows = await db.select().from(rarityWeights);
    return rows.flatMap((row) => {
      if (!isRarity(row.rarity)) return [];
      return [new RarityWeight(row.rarity, row.weight)];
    });
  }

  async replaceAll(weights: RarityWeight[]): Promise<void> {
    await db.transaction(async (tx) => {
      for (const weight of weights) {
        await tx
          .insert(rarityWeights)
          .values({ rarity: weight.rarity, weight: weight.weight })
          .onConflictDoUpdate({
            target: rarityWeights.rarity,
            set: { weight: weight.weight },
          });
      }
    });
  }
}

export { DrizzleRarityRepository };
