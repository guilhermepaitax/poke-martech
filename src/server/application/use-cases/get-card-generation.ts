import type { Actor } from "@/server/application/actor";
import { requireAdmin } from "@/server/application/authorize";
import { findEvolutionOrigin, toCardDetail } from "@/server/application/card-input";
import { toCardGenerationDetail } from "@/server/application/card-generation-view";
import type { CardGenerationRepository } from "@/server/application/contracts/repositories/card-generation-repository";
import type { CardRepository } from "@/server/application/contracts/repositories/card-repository";
import { NotFoundError } from "@/server/shared/app-error";
import { err, success, type Result } from "@/server/shared/result";
import type { CardDetail, CardGenerationDetail } from "@/types/catalog";

class GetCardGeneration {
  constructor(
    private readonly generations: CardGenerationRepository,
    private readonly cards: CardRepository,
  ) {}

  async execute(input: { id: string }, actor: Actor | null): Promise<Result<CardGenerationDetail>> {
    const auth = requireAdmin(actor);
    if (!auth.ok) return auth;
    const batch = await this.generations.findById(input.id);
    if (!batch) return err(new NotFoundError("Geração"));
    const cards = new Map<string, CardDetail>();
    for (const item of batch.items) {
      if (!item.cardId) continue;
      const card = await this.cards.findById(item.cardId);
      if (!card) continue;
      const origin = await findEvolutionOrigin(card, (id) => this.cards.findById(id));
      cards.set(card.id, toCardDetail(card, origin));
    }
    return success(toCardGenerationDetail(batch, cards, new Date()));
  }
}

export { GetCardGeneration };
