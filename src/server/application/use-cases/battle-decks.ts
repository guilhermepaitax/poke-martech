import { validateDeck } from "@/lib/battle/deck-rules";
import type { Actor } from "@/server/application/actor";
import { requireUser } from "@/server/application/authorize";
import type { BattleDeckRepository } from "@/server/application/contracts/repositories/battle-deck-repository";
import type { BattleRepository } from "@/server/application/contracts/repositories/battle-repository";
import { BattleDeck } from "@/server/application/entities/battle";
import { NotFoundError, ValidationError } from "@/server/shared/app-error";
import { err, success, type Result } from "@/server/shared/result";
import type { BattleDeckDetail, BattleDeckInput, BattleDeckSummary } from "@/types/battle";

class ListMyDecks {
  constructor(private readonly decks: BattleDeckRepository) {}

  async execute(_input: unknown, actor: Actor | null): Promise<Result<BattleDeckSummary[]>> {
    const auth = requireUser(actor);
    if (!auth.ok) return auth;
    return success(await this.decks.listByUser(auth.value.id));
  }
}

class GetDeck {
  constructor(private readonly decks: BattleDeckRepository) {}

  async execute(input: { id: string }, actor: Actor | null): Promise<Result<BattleDeckDetail>> {
    const auth = requireUser(actor);
    if (!auth.ok) return auth;
    const deck = await this.decks.findById(input.id, auth.value.id);
    if (!deck) return err(new NotFoundError("Deck"));
    return success(deck);
  }
}

class SaveDeck {
  constructor(
    private readonly decks: BattleDeckRepository,
    private readonly battles: BattleRepository,
  ) {}

  async execute(
    input: BattleDeckInput & { id?: string },
    actor: Actor | null,
  ): Promise<Result<{ id: string }>> {
    const auth = requireUser(actor);
    if (!auth.ok) return auth;
    const cardIds = input.cards.map((item) => item.cardId);
    const [owned, loaded] = await Promise.all([
      this.decks.ownedCounts(auth.value.id, cardIds),
      this.battles.loadCards(cardIds),
    ]);
    const byId = new Map(loaded.map((card) => [card.cardId, card]));
    const entries = input.cards.map((item) => {
      const card = byId.get(item.cardId);
      return {
        cardId: item.cardId,
        name: card?.name ?? item.cardId,
        stage: card?.stage ?? "stage1",
        energyType: card?.energyType ?? "ia",
        copies: item.copies,
        owned: owned.get(item.cardId) ?? 0,
      };
    });
    if (loaded.length !== new Set(cardIds).size) {
      return err(new ValidationError("Uma das cartas do deck não existe."));
    }
    const errors = validateDeck(entries, input.energyTypes);
    if (errors.length > 0) return err(new ValidationError(errors[0]));
    if (input.id) {
      const existing = await this.decks.findById(input.id, auth.value.id);
      if (!existing) return err(new NotFoundError("Deck"));
    }
    const saved = await this.decks.save(
      new BattleDeck(input.id ?? "", auth.value.id, input.name, input.energyTypes, input.cards),
    );
    if (!saved.ok) return err(new NotFoundError("Deck"));
    return success({ id: saved.id });
  }
}

class DeleteDeck {
  constructor(private readonly decks: BattleDeckRepository) {}

  async execute(input: { id: string }, actor: Actor | null): Promise<Result<{ ok: true }>> {
    const auth = requireUser(actor);
    if (!auth.ok) return auth;
    const deleted = await this.decks.delete(input.id, auth.value.id);
    if (!deleted) return err(new NotFoundError("Deck"));
    return success({ ok: true });
  }
}

export { DeleteDeck, GetDeck, ListMyDecks, SaveDeck };
