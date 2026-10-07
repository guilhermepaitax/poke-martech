import { describe, expect, it } from "vitest";
import type { BattleCardData } from "@/lib/battle/battle-state";
import { createBattle } from "@/lib/battle/create-battle";
import type { BattleStatus } from "@/lib/value-objects/battle";
import type { BattleDeckRepository } from "@/server/application/contracts/repositories/battle-deck-repository";
import type { BattleOpponentRepository } from "@/server/application/contracts/repositories/battle-opponent-repository";
import type { BattleRepository } from "@/server/application/contracts/repositories/battle-repository";
import { BattleOpponent } from "@/server/application/entities/battle";
import { Battle } from "@/server/application/entities/battle-match";
import { SaveDeck } from "@/server/application/use-cases/battle-decks";
import { SubmitBattleAction } from "@/server/application/use-cases/battles";
import type { BattleDeckDetail, BattleDeckSummary } from "@/types/battle";

const actor = { id: "user-1", role: "user" };

function sampleCard(id: string, stage: BattleCardData["stage"] = "basic"): BattleCardData {
  return {
    cardId: id,
    name: id,
    imageUrl: null,
    imageX: 50,
    imageY: 50,
    imageScale: 100,
    overlayImageUrl: null,
    overlayX: 50,
    overlayY: 50,
    overlayScale: 100,
    decorationAsset: null,
    decorationImageUrl: null,
    rarity: "common",
    hp: 60,
    energyType: "devops",
    frame: "basic",
    stage,
    evolvesFrom: null,
    evolvesFromId: null,
    retreatCost: 1,
    weaknessType: null,
    weaknessModifier: 20,
    flavorText: "",
    attacks: [
      {
        name: "Golpe",
        damage: 20,
        effectText: "",
        effects: [],
        energyCost: [{ type: "ia", count: 1 }],
        sortOrder: 0,
      },
    ],
  };
}

class MemoryDecks implements BattleDeckRepository {
  owned = new Map<string, number>();
  saved: BattleDeckSummary[] = [];

  async listByUser(): Promise<BattleDeckSummary[]> {
    return this.saved;
  }
  async findById(): Promise<BattleDeckDetail | null> {
    return null;
  }
  async save(deck: { id: string; name: string; energyTypes: BattleDeckSummary["energyTypes"] }) {
    const id = deck.id || "deck-1";
    this.saved.push({ id, name: deck.name, energyTypes: deck.energyTypes, cardCount: 20 });
    return { ok: true as const, id };
  }
  async delete(): Promise<boolean> {
    return true;
  }
  async ownedCounts() {
    return this.owned;
  }
}

class MemoryBattles implements BattleRepository {
  cards: BattleCardData[] = [];
  match: Battle | null = null;
  credits = 0;

  async findById() {
    return this.match;
  }
  async findActiveByUser() {
    return null;
  }
  async create() {
    return "battle-1";
  }
  async update(input: { status: BattleStatus; expectedVersion: number }) {
    if (!this.match) return { ok: false as const, reason: "not_found" as const };
    if (this.match.version !== input.expectedVersion) return { ok: false as const, reason: "conflict" as const };
    if (input.status === "won") this.credits += 1;
    this.match = new Battle(
      this.match.id,
      this.match.userId,
      this.match.opponentId,
      this.match.deckId,
      input.status,
      this.match.state,
      this.match.version + 1,
      this.match.rewardCoins,
    );
    return { ok: true as const };
  }
  async loadCards() {
    return this.cards;
  }
}

class MemoryOpponents implements BattleOpponentRepository {
  opponent = new BattleOpponent(
    "opp-1",
    "Rival",
    "rival",
    null,
    "",
    "normal",
    20,
    ["devops"],
    true,
    0,
    [{ cardId: "c1", copies: 20 }],
  );
  async listActive() {
    return [];
  }
  async listAll() {
    return [];
  }
  async findById() {
    return this.opponent;
  }
  async findActiveById() {
    return this.opponent;
  }
  async create() {
    return { ok: true as const, id: "opp-1" };
  }
  async update() {
    return { ok: true as const };
  }
}

describe("SaveDeck", () => {
  it("rejects decks the user does not own enough copies of", async () => {
    const decks = new MemoryDecks();
    const battles = new MemoryBattles();
    battles.cards = [sampleCard("c1")];
    decks.owned.set("c1", 1);
    const useCase = new SaveDeck(decks, battles);
    const result = await useCase.execute(
      {
        name: "Time",
        energyTypes: ["devops"],
        cards: [{ cardId: "c1", copies: 2 }],
      },
      actor,
    );
    expect(result.ok).toBe(false);
  });

  it("saves a valid 20-card deck", async () => {
    const decks = new MemoryDecks();
    const battles = new MemoryBattles();
    const cards = Array.from({ length: 10 }, (_, index) => sampleCard(`c${index}`));
    battles.cards = cards;
    for (const card of cards) decks.owned.set(card.cardId, 2);
    const useCase = new SaveDeck(decks, battles);
    const result = await useCase.execute(
      {
        name: "Time",
        energyTypes: ["devops"],
        cards: cards.map((card) => ({ cardId: card.cardId, copies: 2 })),
      },
      actor,
    );
    expect(result.ok).toBe(true);
  });
});

describe("SubmitBattleAction", () => {
  it("rejects a stale version", async () => {
    const battles = new MemoryBattles();
    const opponents = new MemoryOpponents();
    const deck = {
      energyTypes: ["devops"] as const,
      cards: [{ card: sampleCard("c1"), copies: 20 }],
    };
    const created = createBattle({ seed: 1, player: { ...deck, energyTypes: ["devops"] }, cpu: { ...deck, energyTypes: ["devops"] } });
    battles.match = new Battle("b1", "user-1", "opp-1", "d1", "active", created.state, 3, 20);
    const useCase = new SubmitBattleAction(battles, opponents);
    const result = await useCase.execute(
      { id: "b1", version: 2, action: { type: "end_turn" } },
      actor,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.statusCode).toBe(409);
  });
});
