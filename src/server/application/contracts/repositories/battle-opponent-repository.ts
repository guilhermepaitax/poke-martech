import type { BattleOpponent } from "@/server/application/entities/battle";
import type { BattleOpponentSummary } from "@/types/battle";

interface BattleOpponentRepository {
  listActive(): Promise<BattleOpponentSummary[]>;
  listAll(): Promise<BattleOpponentSummary[]>;
  findById(id: string): Promise<BattleOpponent | null>;
  findActiveById(id: string): Promise<BattleOpponent | null>;
  create(opponent: BattleOpponent): Promise<{ ok: true; id: string } | { ok: false; reason: "conflict" }>;
  update(opponent: BattleOpponent): Promise<{ ok: true } | { ok: false; reason: "conflict" | "not_found" }>;
}

export type { BattleOpponentRepository };
