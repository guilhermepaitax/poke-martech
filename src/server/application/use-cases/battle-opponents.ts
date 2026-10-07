import { validateDeck } from "@/lib/battle/deck-rules";
import type { Actor } from "@/server/application/actor";
import { requireAdmin, requireUser } from "@/server/application/authorize";
import type { BattleOpponentRepository } from "@/server/application/contracts/repositories/battle-opponent-repository";
import type { BattleRepository } from "@/server/application/contracts/repositories/battle-repository";
import { BattleOpponent } from "@/server/application/entities/battle";
import { ConflictError, NotFoundError, ValidationError } from "@/server/shared/app-error";
import { err, success, type Result } from "@/server/shared/result";
import type {
  BattleOpponentDetail,
  BattleOpponentInput,
  BattleOpponentSummary,
} from "@/types/battle";

class ListBattleOpponents {
  constructor(private readonly opponents: BattleOpponentRepository) {}

  async execute(_input: unknown, actor: Actor | null): Promise<Result<BattleOpponentSummary[]>> {
    const auth = requireUser(actor);
    if (!auth.ok) return auth;
    return success(await this.opponents.listActive());
  }
}

class ListAdminOpponents {
  constructor(private readonly opponents: BattleOpponentRepository) {}

  async execute(_input: unknown, actor: Actor | null): Promise<Result<BattleOpponentSummary[]>> {
    const auth = requireAdmin(actor);
    if (!auth.ok) return auth;
    return success(await this.opponents.listAll());
  }
}

class GetAdminOpponent {
  constructor(private readonly opponents: BattleOpponentRepository) {}

  async execute(input: { id: string }, actor: Actor | null): Promise<Result<BattleOpponentDetail>> {
    const auth = requireAdmin(actor);
    if (!auth.ok) return auth;
    const opponent = await this.opponents.findById(input.id);
    if (!opponent) return err(new NotFoundError("Adversário"));
    return success(toDetail(opponent));
  }
}

class CreateOpponent {
  constructor(
    private readonly opponents: BattleOpponentRepository,
    private readonly battles: BattleRepository,
  ) {}

  async execute(input: BattleOpponentInput, actor: Actor | null): Promise<Result<{ id: string }>> {
    const auth = requireAdmin(actor);
    if (!auth.ok) return auth;
    const invalid = await assertOpponentDeck(this.battles, input);
    if (invalid) return err(invalid);
    const created = await this.opponents.create(toEntity("", input));
    if (!created.ok) return err(new ConflictError("Já existe um adversário com esse identificador."));
    return success({ id: created.id });
  }
}

class UpdateOpponent {
  constructor(
    private readonly opponents: BattleOpponentRepository,
    private readonly battles: BattleRepository,
  ) {}

  async execute(
    input: BattleOpponentInput & { id: string },
    actor: Actor | null,
  ): Promise<Result<{ id: string }>> {
    const auth = requireAdmin(actor);
    if (!auth.ok) return auth;
    const invalid = await assertOpponentDeck(this.battles, input);
    if (invalid) return err(invalid);
    const updated = await this.opponents.update(toEntity(input.id, input));
    if (!updated.ok && updated.reason === "not_found") return err(new NotFoundError("Adversário"));
    if (!updated.ok) return err(new ConflictError("Já existe um adversário com esse identificador."));
    return success({ id: input.id });
  }
}

async function assertOpponentDeck(battles: BattleRepository, input: BattleOpponentInput) {
  const loaded = await battles.loadCards(input.cards.map((item) => item.cardId));
  const byId = new Map(loaded.map((card) => [card.cardId, card]));
  if (loaded.length !== new Set(input.cards.map((item) => item.cardId)).size) {
    return new ValidationError("Uma das cartas do adversário não existe.");
  }
  const entries = input.cards.map((item) => {
    const card = byId.get(item.cardId);
    return {
      cardId: item.cardId,
      name: card?.name ?? item.cardId,
      stage: card?.stage ?? "stage1",
      energyType: card?.energyType ?? "ia",
      copies: item.copies,
      owned: null,
    };
  });
  const errors = validateDeck(entries, input.energyTypes);
  return errors.length > 0 ? new ValidationError(errors[0]) : null;
}

function toEntity(id: string, input: BattleOpponentInput) {
  return new BattleOpponent(
    id,
    input.name,
    input.slug,
    input.avatarUrl,
    input.description,
    input.difficulty,
    input.rewardCoins,
    input.energyTypes,
    input.active,
    input.sortOrder,
    input.cards,
  );
}

function toDetail(opponent: BattleOpponent): BattleOpponentDetail {
  return {
    id: opponent.id,
    name: opponent.name,
    slug: opponent.slug,
    avatarUrl: opponent.avatarUrl,
    description: opponent.description,
    difficulty: opponent.difficulty,
    rewardCoins: opponent.rewardCoins,
    active: opponent.active,
    energyTypes: opponent.energyTypes,
    sortOrder: opponent.sortOrder,
    cards: opponent.cards,
  };
}

export {
  CreateOpponent,
  GetAdminOpponent,
  ListAdminOpponents,
  ListBattleOpponents,
  UpdateOpponent,
};
