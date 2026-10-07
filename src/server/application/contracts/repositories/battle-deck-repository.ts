import type { BattleDeck } from "@/server/application/entities/battle";
import type { BattleDeckDetail, BattleDeckSummary } from "@/types/battle";

interface BattleDeckRepository {
  listByUser(userId: string): Promise<BattleDeckSummary[]>;
  findById(id: string, userId: string): Promise<BattleDeckDetail | null>;
  save(deck: BattleDeck): Promise<{ ok: true; id: string } | { ok: false; reason: "not_found" }>;
  delete(id: string, userId: string): Promise<boolean>;
  ownedCounts(userId: string, cardIds: string[]): Promise<Map<string, number>>;
}

export type { BattleDeckRepository };
