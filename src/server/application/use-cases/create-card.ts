import type { Actor } from "@/server/application/actor";
import { requireAdmin } from "@/server/application/authorize";
import { assertCardEvolution, toCardEntity } from "@/server/application/card-input";
import type { CardRepository } from "@/server/application/contracts/repositories/card-repository";
import { ConflictError } from "@/server/shared/app-error";
import { err, success, type Result } from "@/server/shared/result";
import type { CardInput } from "@/types/catalog";

class CreateCard {
  constructor(private readonly cards: CardRepository) {}

  async execute(input: CardInput, actor: Actor | null): Promise<Result<{ id: string }>> {
    const auth = requireAdmin(actor);
    if (!auth.ok) return auth;
    const evolutionError = await assertCardEvolution(this.cards, input);
    if (evolutionError) return err(evolutionError);
    const created = await this.cards.create(toCardEntity("", input));
    if (!created.ok) return err(new ConflictError("Já existe uma carta com esse identificador."));
    return success({ id: created.id });
  }
}

export { CreateCard };
