import type { CardRepository } from "@/server/application/contracts/repositories/card-repository";
import { Card, CardAttack } from "@/server/application/entities/card";
import {
  ARENA_FIGHTER_SLUGS,
  GetArenaFighters,
} from "@/server/application/use-cases/get-arena-fighters";
import { describe, expect, it } from "vitest";

function card(input: {
  slug: string;
  name: string;
  hp: number;
  imageUrl: string | null;
  damage: number | null;
}) {
  return new Card(
    input.slug,
    1,
    input.name,
    input.slug,
    input.imageUrl,
    50,
    50,
    100,
    null,
    50,
    50,
    100,
    null,
    null,
    input.hp,
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
    [new CardAttack("Golpe", input.damage, "", [], 0)],
  );
}

class MemoryArenaCards implements CardRepository {
  constructor(private readonly cards: Card[]) {}

  async listAll() {
    return [];
  }

  async listPublished() {
    return [];
  }

  async listPublishedCards() {
    return [];
  }

  async findById() {
    return null;
  }

  async findPublishedById() {
    return null;
  }

  async findPublishedBySlug(slug: string) {
    return this.cards.find((item) => item.slug === slug) ?? null;
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

describe("GetArenaFighters", () => {
  it("mapeia os dois slugs na ordem jogador e oponente", async () => {
    const useCase = new GetArenaFighters(
      new MemoryArenaCards([
        card({
          slug: ARENA_FIGHTER_SLUGS.opponent,
          name: "Rafrpie",
          hp: 50,
          imageUrl: null,
          damage: null,
        }),
        card({
          slug: ARENA_FIGHTER_SLUGS.player,
          name: "Calvassauro",
          hp: 70,
          imageUrl: "https://cdn.example/calvassauro.png",
          damage: 40,
        }),
      ]),
    );

    const result = await useCase.execute();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.player).toEqual({
      id: ARENA_FIGHTER_SLUGS.player,
      name: "Calvassauro",
      hp: 70,
      imageUrl: "https://cdn.example/calvassauro.png",
      attackDamage: 40,
    });
    expect(result.value.opponent).toEqual({
      id: ARENA_FIGHTER_SLUGS.opponent,
      name: "Rafrpie",
      hp: 50,
      imageUrl: null,
      attackDamage: 0,
    });
  });

  it("falha quando um slug publicado não existe", async () => {
    const useCase = new GetArenaFighters(
      new MemoryArenaCards([
        card({
          slug: ARENA_FIGHTER_SLUGS.player,
          name: "Calvassauro",
          hp: 70,
          imageUrl: null,
          damage: 40,
        }),
      ]),
    );

    const result = await useCase.execute();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("NOT_FOUND");
  });
});
