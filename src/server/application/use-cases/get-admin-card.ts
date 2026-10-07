import type { Actor } from "@/server/application/actor";
import { requireAdmin } from "@/server/application/authorize";
import { findEvolutionOrigin, toCardDetail } from "@/server/application/card-input";
import type { CardRepository } from "@/server/application/contracts/repositories/card-repository";
import { NotFoundError } from "@/server/shared/app-error";
import { err, success, type Result } from "@/server/shared/result";
import type { CardDetail } from "@/types/catalog";

class GetAdminCard {
  constructor(private readonly cards: CardRepository) {}

  async execute(input: { id: string }, actor: Actor | null): Promise<Result<CardDetail>> {
    const auth = requireAdmin(actor);
    if (!auth.ok) return auth;
    const card = await this.cards.findById(input.id);
    if (!card) return err(new NotFoundError("Carta"));
    const origin = await findEvolutionOrigin(card, (id) => this.cards.findById(id));
    return success(toCardDetail(card, origin));
  }
}

export { GetAdminCard };
