import { describe, expect, it } from "vitest";
import { cardToFighter, type CardFighterSource } from "./fighter";

function source(patch: Partial<CardFighterSource> = {}): CardFighterSource {
  return {
    id: "card-1",
    name: "Calvassauro",
    hp: 70,
    imageUrl: "https://cdn.example/calvassauro.png",
    attacks: [{ damage: 40, sortOrder: 0 }],
    ...patch,
  };
}

describe("cardToFighter", () => {
  it("usa o primeiro ataque com dano numérico", () => {
    const fighter = cardToFighter(
      source({
        attacks: [
          { damage: null, sortOrder: 0 },
          { damage: 10, sortOrder: 2 },
          { damage: 40, sortOrder: 1 },
        ],
      }),
    );

    expect(fighter).toMatchObject({
      id: "card-1",
      name: "Calvassauro",
      hp: 70,
      imageUrl: "https://cdn.example/calvassauro.png",
      attackDamage: 40,
    });
  });

  it("fica com dano zero sem ataque numérico", () => {
    expect(cardToFighter(source({ attacks: [] })).attackDamage).toBe(0);
    expect(
      cardToFighter(source({ attacks: [{ damage: null, sortOrder: 0 }] }))
        .attackDamage,
    ).toBe(0);
  });

  it("aceita carta sem imagem", () => {
    expect(cardToFighter(source({ imageUrl: null })).imageUrl).toBeNull();
    expect(cardToFighter(source({ imageUrl: "  " })).imageUrl).toBeNull();
  });

  it("sobe HP zero para 1", () => {
    expect(cardToFighter(source({ hp: 0 })).hp).toBe(1);
  });
});
