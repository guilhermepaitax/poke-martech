import type { RarityWeight } from "@/server/application/entities/rarity-weight";

interface RarityRepository {
  list(): Promise<RarityWeight[]>;
  replaceAll(weights: RarityWeight[]): Promise<void>;
}

export type { RarityRepository };
