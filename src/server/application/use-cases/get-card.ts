import type { Actor } from "@/server/application/actor";
import { findEvolutionOrigin, toCardDetail } from "@/server/application/card-input";
import { requireUser } from "@/server/application/authorize";
import type { CardRepository } from "@/server/application/contracts/repositories/card-repository";
import { NotFoundError } from "@/server/shared/app-error";
import { err, success, type Result } from "@/server/shared/result";
import type { CardDetail } from "@/types/catalog";

class GetCard {
  constructor(private readonly cards: CardRepository) {}

  async execute(input: { id: string }, actor: Actor | null): Promise<Result<CardDetail>> {
    const auth = requireUser(actor);
    if (!auth.ok) return auth;
    const card = await this.cards.findPublishedById(input.id);
    if (!card) return err(new NotFoundError("Carta"));
    const ownedCount = await this.cards.ownedCount(auth.value.id, card.id);
    if (ownedCount === 0) return err(new NotFoundError("Carta"));
    const origin = await findEvolutionOrigin(card, (id) => this.cards.findPublishedById(id));
    return success(toCardDetail(card, origin, ownedCount));
  }
}

export { GetCard };
