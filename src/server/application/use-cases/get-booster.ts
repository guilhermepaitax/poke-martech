import type { Actor } from "@/server/application/actor";
import { requireUser } from "@/server/application/authorize";
import type { BoosterRepository } from "@/server/application/contracts/repositories/booster-repository";
import { NotFoundError } from "@/server/shared/app-error";
import { err, success, type Result } from "@/server/shared/result";
import type { BoosterDetail } from "@/types/catalog";

class GetBooster {
  constructor(private readonly boosters: BoosterRepository) {}

  async execute(
    input: { slug: string },
    actor: Actor | null,
  ): Promise<Result<BoosterDetail>> {
    const auth = requireUser(actor);
    if (!auth.ok) return auth;
    const booster = await this.boosters.findActiveBySlug(input.slug);
    if (!booster) return err(new NotFoundError("Pacote"));
    return success({
      id: booster.id,
      name: booster.name,
      slug: booster.slug,
      imageUrl: booster.imageUrl,
      description: booster.description,
      price: booster.price,
      cardsPerPack: booster.cardsPerPack,
      stock: booster.stock,
      featuredSlotMinRarity: booster.featuredSlotMinRarity,
      finish: booster.finish,
      active: booster.active,
      cards: booster.cards,
    });
  }
}

export { GetBooster };
