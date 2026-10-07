import type { Actor } from "@/server/application/actor";
import { requireAdmin } from "@/server/application/authorize";
import { assertCardEvolution, toCardEntity } from "@/server/application/card-input";
import type { CardRepository } from "@/server/application/contracts/repositories/card-repository";
import { ConflictError, NotFoundError } from "@/server/shared/app-error";
import { err, success, type Result } from "@/server/shared/result";
import type { CardInput } from "@/types/catalog";

class UpdateCard {
  constructor(private readonly cards: CardRepository) {}

  async execute(
    input: CardInput & { id: string },
    actor: Actor | null,
  ): Promise<Result<{ id: string }>> {
    const auth = requireAdmin(actor);
    if (!auth.ok) return auth;
    const evolutionError = await assertCardEvolution(this.cards, input, input.id);
    if (evolutionError) return err(evolutionError);
    const updated = await this.cards.update(toCardEntity(input.id, input));
    if (!updated.ok && updated.reason === "not_found") return err(new NotFoundError("Carta"));
    if (!updated.ok) return err(new ConflictError("Já existe uma carta com esse identificador."));
    return success({ id: input.id });
  }
}

export { UpdateCard };
