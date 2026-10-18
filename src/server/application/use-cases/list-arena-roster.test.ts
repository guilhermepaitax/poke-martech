import type {
  CardRepository,
  PublishedCardRecord,
} from "@/server/application/contracts/repositories/card-repository";
import { Card, CardAttack } from "@/server/application/entities/card";
import { ARENA_FIGHTER_SLUGS } from "@/server/application/use-cases/get-arena-fighters";
import { ListArenaRoster } from "@/server/application/use-cases/list-arena-roster";
import type { CardFace } from "@/types/catalog";
import { describe, expect, it } from "vitest";

function card(slug: string, name: string, hp: number, damage: number | null) {
  return new Card(
    slug,
    1,
    name,
    slug,
    null,
    50,
    50,
    100,
    null,
    50,
    50,
    100,
    null,
    null,
    hp,
    "frontend",
    "basic",
    "basic",
    null,
    1,
    null,
    20,
    "common",
    "",
    true,
    [],
    [new CardAttack("Golpe", damage, "", [], 0)],
  );
}

function record(card: Card): PublishedCardRecord {
  const face: CardFace = {
    name: card.name,
    imageUrl: card.imageUrl,
    imageX: card.imageX,
    imageY: card.imageY,
    imageScale: card.imageScale,
    overlayImageUrl: card.overlayImageUrl,
    overlayX: card.overlayX,
    overlayY: card.overlayY,
    overlayScale: card.overlayScale,
    decorationAsset: card.decorationAsset,
    decorationImageUrl: card.decorationImageUrl,
    rarity: card.rarity,
    hp: card.hp,
    energyType: card.energyType,
    frame: card.frame,
    stage: card.stage,
    evolvesFrom: null,
    retreatCost: card.retreatCost,
    weaknessType: card.weaknessType,
    weaknessModifier: card.weaknessModifier,
    flavorText: card.flavorText,
    attacks: card.attacks.map((attack) => ({
      name: attack.name,
      damage: attack.damage,
      effectText: attack.effectText,
      energyCost: attack.energyCost,
      sortOrder: attack.sortOrder,
    })),
  };
  return { id: card.id, slug: card.slug, face };
}

class MemoryRosterCards implements CardRepository {
  constructor(private readonly cards: Card[]) {}

  async listAll() {
    return [];
  }

  async listPublished() {
    return [];
  }

  async listPublishedCards() {
    return this.cards.map(record);
  }

  async findById() {
    return null;
  }

  async findPublishedById() {
    return null;
  }

  async findPublishedBySlug() {
    return null;
  }

  async ownedCount() {
    return 0;
  }

  async create() {
    return { ok: true as const, id: "new" };
  }

  async update() {
    return { ok: true as const };
  }
}

describe("ListArenaRoster", () => {
  it("lista as cartas publicadas e sugere os dois slugs fixos", async () => {
    const useCase = new ListArenaRoster(
      new MemoryRosterCards([
        card("outro", "Outro", 40, 10),
        card(ARENA_FIGHTER_SLUGS.opponent, "Rafrpie", 50, null),
        card(ARENA_FIGHTER_SLUGS.player, "Calvassauro", 70, 40),
      ]),
    );

    const result = await useCase.execute();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.fighters.map((entry) => entry.fighter.name)).toEqual([
      "Outro",
      "Rafrpie",
      "Calvassauro",
    ]);
    expect(result.value.playerId).toBe(ARENA_FIGHTER_SLUGS.player);
    expect(result.value.opponentId).toBe(ARENA_FIGHTER_SLUGS.opponent);
    expect(result.value.fighters[1]?.fighter.attackDamage).toBe(0);
    expect(result.value.fighters[2]?.fighter.attackDamage).toBe(40);
    expect(result.value.fighters[2]?.face.name).toBe("Calvassauro");
  });

  it("falha quando não há dois lutadores", async () => {
    const useCase = new ListArenaRoster(
      new MemoryRosterCards([card("sozinho", "Sozinho", 30, 10)]),
    );

    const result = await useCase.execute();

    expect(result.ok).toBe(false);
  });
});
