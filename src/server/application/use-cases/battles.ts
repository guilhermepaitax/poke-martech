import { applyAction } from "@/lib/battle/apply-action";
import type { BattleAction } from "@/lib/battle/battle-action";
import { createBattle, type BattleDeckInput as EngineDeck } from "@/lib/battle/create-battle";
import type { BattleCardData } from "@/lib/battle/battle-state";
import { playCpuTurn } from "@/server/application/battle/cpu-player";
import { statusFromWinner, toBattleView } from "@/server/application/battle/to-battle-view";
import type { Actor } from "@/server/application/actor";
import { requireUser } from "@/server/application/authorize";
import type { BattleDeckRepository } from "@/server/application/contracts/repositories/battle-deck-repository";
import type { BattleOpponentRepository } from "@/server/application/contracts/repositories/battle-opponent-repository";
import type { BattleRepository } from "@/server/application/contracts/repositories/battle-repository";
import { BattleOpponent } from "@/server/application/entities/battle";
import { ConflictError, NotFoundError, ValidationError } from "@/server/shared/app-error";
import { err, success, type Result } from "@/server/shared/result";
import type {
  ActiveBattleSummary,
  BattleActionResult,
  BattleOpponentSummary,
  BattleView,
} from "@/types/battle";

class ListActiveBattle {
  constructor(
    private readonly battles: BattleRepository,
    private readonly opponents: BattleOpponentRepository,
  ) {}

  async execute(
    _input: unknown,
    actor: Actor | null,
  ): Promise<Result<{ active: ActiveBattleSummary | null; opponents: BattleOpponentSummary[] }>> {
    const auth = requireUser(actor);
    if (!auth.ok) return auth;
    const [active, opponents] = await Promise.all([
      this.battles.findActiveByUser(auth.value.id),
      this.opponents.listActive(),
    ]);
    return success({ active, opponents });
  }
}

class StartBattle {
  constructor(
    private readonly battles: BattleRepository,
    private readonly decks: BattleDeckRepository,
    private readonly opponents: BattleOpponentRepository,
  ) {}

  async execute(
    input: { deckId: string; opponentId: string },
    actor: Actor | null,
  ): Promise<Result<BattleActionResult>> {
    const auth = requireUser(actor);
    if (!auth.ok) return auth;
    const existing = await this.battles.findActiveByUser(auth.value.id);
    if (existing) return err(new ValidationError("Já existe uma batalha em andamento."));
    const deck = await this.decks.findById(input.deckId, auth.value.id);
    if (!deck) return err(new NotFoundError("Deck"));
    const opponent = await this.opponents.findActiveById(input.opponentId);
    if (!opponent) return err(new NotFoundError("Adversário"));
    const playerDeck = await toEngineDeck(this.battles, deck.cards, deck.energyTypes);
    const cpuDeck = await toEngineDeck(this.battles, opponent.cards, opponent.energyTypes);
    if ("error" in playerDeck) return err(playerDeck.error);
    if ("error" in cpuDeck) return err(cpuDeck.error);
    const created = createBattle({
      seed: (Math.random() * 0xffffffff) | 0,
      player: playerDeck,
      cpu: cpuDeck,
    });
    const cpu = playCpuTurn(created.state, opponent.difficulty);
    const id = await this.battles.create({
      userId: auth.value.id,
      opponentId: opponent.id,
      deckId: deck.id,
      state: cpu.state,
      rewardCoins: opponent.rewardCoins,
    });
    return success({
      battle: toBattleView({
        id,
        version: 0,
        status: "active",
        rewardCoins: opponent.rewardCoins,
        opponent: toOpponentSummary(opponent),
        state: cpu.state,
      }),
      events: [...created.events, ...cpu.events],
    });
  }
}

class GetBattle {
  constructor(
    private readonly battles: BattleRepository,
    private readonly opponents: BattleOpponentRepository,
  ) {}

  async execute(input: { id: string }, actor: Actor | null): Promise<Result<BattleView>> {
    const auth = requireUser(actor);
    if (!auth.ok) return auth;
    const battle = await this.battles.findById(input.id, auth.value.id);
    if (!battle) return err(new NotFoundError("Batalha"));
    const opponent = await this.opponents.findById(battle.opponentId);
    if (!opponent) return err(new NotFoundError("Adversário"));
    return success(
      toBattleView({
        id: battle.id,
        version: battle.version,
        status: battle.status,
        rewardCoins: battle.rewardCoins,
        opponent: toOpponentSummary(opponent),
        state: battle.state,
      }),
    );
  }
}

class SubmitBattleAction {
  constructor(
    private readonly battles: BattleRepository,
    private readonly opponents: BattleOpponentRepository,
  ) {}

  async execute(
    input: { id: string; version: number; action: BattleAction },
    actor: Actor | null,
  ): Promise<Result<BattleActionResult>> {
    const auth = requireUser(actor);
    if (!auth.ok) return auth;
    const battle = await this.battles.findById(input.id, auth.value.id);
    if (!battle) return err(new NotFoundError("Batalha"));
    if (battle.status !== "active") return err(new ValidationError("A batalha já terminou."));
    if (battle.version !== input.version) {
      return err(new ConflictError("A batalha mudou. Atualize e tente de novo."));
    }
    const opponent = await this.opponents.findById(battle.opponentId);
    if (!opponent) return err(new NotFoundError("Adversário"));
    const applied = applyAction(battle.state, "player", input.action);
    if (!applied.ok) return err(new ValidationError(applied.error));
    const cpu = playCpuTurn(applied.state, opponent.difficulty);
    const status = statusFromWinner(cpu.state.winner);
    const saved = await this.battles.update({
      id: battle.id,
      userId: auth.value.id,
      expectedVersion: battle.version,
      state: cpu.state,
      status,
      rewardCoins: battle.rewardCoins,
    });
    if (!saved.ok && saved.reason === "conflict") {
      return err(new ConflictError("A batalha mudou. Atualize e tente de novo."));
    }
    if (!saved.ok) return err(new NotFoundError("Batalha"));
    return success({
      battle: toBattleView({
        id: battle.id,
        version: battle.version + 1,
        status,
        rewardCoins: battle.rewardCoins,
        opponent: toOpponentSummary(opponent),
        state: cpu.state,
      }),
      events: [...applied.events, ...cpu.events],
    });
  }
}

class ForfeitBattle {
  constructor(
    private readonly battles: BattleRepository,
    private readonly opponents: BattleOpponentRepository,
  ) {}

  async execute(
    input: { id: string; version: number },
    actor: Actor | null,
  ): Promise<Result<BattleView>> {
    const auth = requireUser(actor);
    if (!auth.ok) return auth;
    const battle = await this.battles.findById(input.id, auth.value.id);
    if (!battle) return err(new NotFoundError("Batalha"));
    if (battle.status !== "active") return err(new ValidationError("A batalha já terminou."));
    const opponent = await this.opponents.findById(battle.opponentId);
    if (!opponent) return err(new NotFoundError("Adversário"));
    const state = {
      ...battle.state,
      winner: "cpu" as const,
      phase: "finished" as const,
    };
    const saved = await this.battles.update({
      id: battle.id,
      userId: auth.value.id,
      expectedVersion: input.version,
      state,
      status: "forfeited",
    });
    if (!saved.ok && saved.reason === "conflict") {
      return err(new ConflictError("A batalha mudou. Atualize e tente de novo."));
    }
    if (!saved.ok) return err(new NotFoundError("Batalha"));
    return success(
      toBattleView({
        id: battle.id,
        version: battle.version + 1,
        status: "forfeited",
        rewardCoins: battle.rewardCoins,
        opponent: toOpponentSummary(opponent),
        state,
      }),
    );
  }
}

async function toEngineDeck(
  battles: BattleRepository,
  cards: { cardId: string; copies: number }[],
  energyTypes: EngineDeck["energyTypes"],
): Promise<EngineDeck | { error: ValidationError }> {
  const loaded = await battles.loadCards(cards.map((item) => item.cardId));
  const byId = new Map(loaded.map((card) => [card.cardId, card]));
  const entries: { card: BattleCardData; copies: number }[] = [];
  for (const item of cards) {
    const card = byId.get(item.cardId);
    if (!card) return { error: new ValidationError("Carta do deck não encontrada.") };
    entries.push({ card, copies: item.copies });
  }
  return { cards: entries, energyTypes };
}

function toOpponentSummary(opponent: BattleOpponent): BattleOpponentSummary {
  return {
    id: opponent.id,
    name: opponent.name,
    slug: opponent.slug,
    avatarUrl: opponent.avatarUrl,
    description: opponent.description,
    difficulty: opponent.difficulty,
    rewardCoins: opponent.rewardCoins,
    active: opponent.active,
  };
}

export { ForfeitBattle, GetBattle, ListActiveBattle, StartBattle, SubmitBattleAction };
