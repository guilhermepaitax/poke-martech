import { describe, expect, it } from "vitest";
import { ATTACK_NAMES } from "./attack-names";
import {
  EFFECT_TEXT,
  matchAttackEffects,
  printedDamage,
  translateEffect,
} from "./effects";
import { fuseAttackName } from "./fuse";

describe("efeitos de batalha", () => {
  it("traduz cada efeito conhecido e limita a mecânica a 3", () => {
    for (const [source, translation] of Object.entries(EFFECT_TEXT)) {
      expect(translateEffect(source)).toBe(translation);
      expect(matchAttackEffects(source).length).toBeLessThanOrEqual(3);
    }
  });

  it("recusa efeito desconhecido", () => {
    expect(() => translateEffect("Not a real effect.")).toThrow(/sem tradução/);
  });

  it("mapeia cura, status, moeda, banco, descarte e dano condicional", () => {
    expect(matchAttackEffects("Heal 30 damage from this Pokémon.")).toEqual([
      { kind: "heal_self", amount: 30 },
    ]);
    expect(
      matchAttackEffects("Your opponent's Active Pokémon is now Poisoned."),
    ).toEqual([
      {
        kind: "status",
        condition: "poisoned",
        target: "opponent",
        coinFlip: false,
      },
    ]);
    expect(
      matchAttackEffects(
        "Flip a coin. If heads, your opponent's Active Pokémon is now Paralyzed.",
      ),
    ).toEqual([
      {
        kind: "status",
        condition: "paralyzed",
        target: "opponent",
        coinFlip: true,
      },
    ]);
    expect(
      matchAttackEffects("Flip a coin. If tails, this attack does nothing."),
    ).toEqual([{ kind: "coin_or_nothing" }]);
    expect(
      matchAttackEffects(
        "Flip 4 coins. This attack does 40 damage for each heads.",
      ),
    ).toEqual([{ kind: "coin_bonus", coins: 4, amountPerHeads: 40 }]);
    expect(
      matchAttackEffects(
        "This attack also does 10 damage to each of your opponent's Benched Pokémon.",
      ),
    ).toEqual([{ kind: "bench_damage", amount: 10, scope: "all" }]);
    expect(
      matchAttackEffects("This Pokémon also does 20 damage to itself."),
    ).toEqual([{ kind: "self_damage", amount: 20 }]);
    expect(matchAttackEffects("Discard all Energy from this Pokémon.")).toEqual(
      [{ kind: "discard_energy", count: 5, target: "self" }],
    );
    expect(
      matchAttackEffects(
        "Discard a random Energy from your opponent's Active Pokémon.",
      ),
    ).toEqual([{ kind: "discard_energy", count: 1, target: "opponent" }]);
    expect(matchAttackEffects("Draw a card.")).toEqual([
      { kind: "draw_cards", count: 1 },
    ]);
    expect(
      matchAttackEffects(
        "Take 1 {M} Energy from your Energy Zone and attach it to this Pokémon.",
      ),
    ).toEqual([{ kind: "attach_energy_self", count: 1 }]);
    expect(
      matchAttackEffects(
        "If this Pokémon has damage on it, this attack does 60 more damage.",
      ),
    ).toEqual([{ kind: "bonus_if_damaged", amount: 60 }]);
  });

  it("zera o dano impresso quando a moeda é o dano inteiro", () => {
    const effects = matchAttackEffects(
      "Flip 2 coins. This attack does 50 damage for each heads.",
    );
    expect(printedDamage("50×", effects)).toBeNull();
    expect(
      printedDamage(
        "20+",
        matchAttackEffects(
          "Flip a coin. If heads, this attack does 30 more damage.",
        ),
      ),
    ).toBe(20);
    expect(printedDamage("40×", [])).toBe(40);
  });

  it("não inventa mecânica para efeito sem equivalente", () => {
    expect(
      matchAttackEffects(
        "Flip 2 coins. If both of them are heads, this attack does 80 more damage.",
      ),
    ).toEqual([]);
    expect(
      matchAttackEffects(
        "Flip a coin. If heads, this attack does 40 more damage. If tails, this Pokémon also does 20 damage to itself.",
      ),
    ).toEqual([{ kind: "coin_bonus", coins: 1, amountPerHeads: 40 }]);
    expect(
      matchAttackEffects(
        "Take a {G} Energy from your Energy Zone and attach it to 1 of your Benched {G} Pokémon.",
      ),
    ).toEqual([]);
    expect(
      matchAttackEffects(
        "Put 1 random {G} Pokémon from your deck into your hand.",
      ),
    ).toEqual([]);
  });

  it("entende apóstrofo e travessão da fonte", () => {
    expect(
      matchAttackEffects(
        "Flip a coin. If heads, during your opponent’s next turn, prevent all damage from—and effects of—attacks done to this Pokémon.",
      ),
    ).toEqual([{ kind: "prevent_damage_next_turn", coinFlip: true }]);
  });

  it("mantém o nome do ataque dentro do limite", () => {
    for (const attack of Object.keys(ATTACK_NAMES)) {
      expect(fuseAttackName("Hércules", attack).length).toBeLessThanOrEqual(40);
    }
  });
});
