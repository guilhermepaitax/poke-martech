import type { Actor } from "@/server/application/actor";
import { requireAdmin } from "@/server/application/authorize";
import type { BoosterRepository } from "@/server/application/contracts/repositories/booster-repository";
import { Booster } from "@/server/application/entities/booster";
import { ConflictError, NotFoundError, ValidationError } from "@/server/shared/app-error";
import { err, success, type Result } from "@/server/shared/result";
import type { BoosterDetail, BoosterInput, BoosterSummary } from "@/types/catalog";

function toEntity(id: string, input: BoosterInput) {
  return new Booster(
    id,
    input.name,
    input.slug,
    input.imageUrl,
    input.description,
    input.price,
    input.cardsPerPack,
    input.stock,
    input.featuredSlotMinRarity,
    input.finish,
    input.active,
    input.cards,
  );
}

function toDetail(booster: Booster): BoosterDetail {
  return {
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
  };
}

function assertPool(input: BoosterInput) {
  if (input.cards.length < input.cardsPerPack) {
    return new ValidationError("O pacote precisa de pelo menos tantas cartas quanto as que ele entrega.");
  }
  const ids = new Set(input.cards.map((card) => card.cardId));
  if (ids.size !== input.cards.length) {
    return new ValidationError("A mesma carta não pode entrar duas vezes no pacote.");
  }
  return null;
}

class ListAdminBoosters {
  constructor(private readonly boosters: BoosterRepository) {}

  async execute(actor: Actor | null): Promise<Result<BoosterSummary[]>> {
    const auth = requireAdmin(actor);
    if (!auth.ok) return auth;
    return success(await this.boosters.listAll());
  }
}

class GetAdminBooster {
  constructor(private readonly boosters: BoosterRepository) {}

  async execute(input: { id: string }, actor: Actor | null): Promise<Result<BoosterDetail>> {
    const auth = requireAdmin(actor);
    if (!auth.ok) return auth;
    const booster = await this.boosters.findById(input.id);
    if (!booster) return err(new NotFoundError("Pacote"));
    return success(toDetail(booster));
  }
}

class CreateBooster {
  constructor(private readonly boosters: BoosterRepository) {}

  async execute(input: BoosterInput, actor: Actor | null): Promise<Result<{ id: string }>> {
    const auth = requireAdmin(actor);
    if (!auth.ok) return auth;
    const poolError = assertPool(input);
    if (poolError) return err(poolError);
    const created = await this.boosters.create(toEntity("", input));
    if (!created.ok) return err(new ConflictError("Já existe um pacote com esse identificador."));
    return success({ id: created.id });
  }
}

class UpdateBooster {
  constructor(private readonly boosters: BoosterRepository) {}

  async execute(
    input: BoosterInput & { id: string },
    actor: Actor | null,
  ): Promise<Result<{ id: string }>> {
    const auth = requireAdmin(actor);
    if (!auth.ok) return auth;
    const poolError = assertPool(input);
    if (poolError) return err(poolError);
    const updated = await this.boosters.update(toEntity(input.id, input));
    if (!updated.ok && updated.reason === "not_found") return err(new NotFoundError("Pacote"));
    if (!updated.ok) return err(new ConflictError("Já existe um pacote com esse identificador."));
    return success({ id: input.id });
  }
}

export { CreateBooster, GetAdminBooster, ListAdminBoosters, UpdateBooster };
