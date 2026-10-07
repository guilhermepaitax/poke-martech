import type { Actor } from "@/server/application/actor";
import { requireAdmin } from "@/server/application/authorize";
import { toCardGenerationSummary } from "@/server/application/card-generation-view";
import type { CardGenerationRepository } from "@/server/application/contracts/repositories/card-generation-repository";
import { success, type Result } from "@/server/shared/result";
import type { CardGenerationSummary } from "@/types/catalog";

const RECENT_LIMIT = 20;

class ListCardGenerations {
  constructor(private readonly generations: CardGenerationRepository) {}

  async execute(actor: Actor | null): Promise<Result<CardGenerationSummary[]>> {
    const auth = requireAdmin(actor);
    if (!auth.ok) return auth;
    const batches = await this.generations.listRecent(RECENT_LIMIT);
    return success(batches.map(toCardGenerationSummary));
  }
}

export { ListCardGenerations };
