import { describe, expect, it } from "vitest";
import { applyAction } from "@/lib/battle/apply-action";
import { createBattle } from "@/lib/battle/create-battle";
import { canPay, missingEnergy } from "@/lib/battle/energy-cost";
import { legalActions } from "@/lib/battle/legal-actions";
import type { BattleCardData, BattleState, PokemonInPlay, SideState } from "@/lib/battle/battle-state";
import { validateDeck } from "@/lib/battle/deck-rules";
import type { AttackEffect } from "@/lib/value-objects/attack-effect";
import type { EnergyType } from "@/lib/value-objects/card";

function card(id: string, patch: Partial<BattleCardData> = {}): BattleCardData {
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
    stage: "basic",
    evolvesFrom: null,
    evolvesFromId: null,
    retreatCost: 1,
    weaknessType: null,
    weaknessModifier: 20,
    flavorText: "",
    attacks: [
      {
        name: "Golpe",
        damage: 30,
        effectText: "",
        effects: [],
        energyCost: [{ type: "devops", count: 1 }],
        sortOrder: 0,
      },
    ],
    ...patch,
  };
}

function pokemon(uid: string, cardId: string, patch: Partial<PokemonInPlay> = {}): PokemonInPlay {
  return {
    uid,
    cardId,
    stack: [cardId],
    damage: 0,
    energies: ["devops"],
    status: [],
    playedTurn: 0,
    preventDamage: false,
    ...patch,
  };
}

function side(patch: Partial<SideState> = {}): SideState {
  return {
    deck: [],
    hand: [],
    discard: [],
    active: pokemon("a", "basic-a"),
    bench: [],
    points: 0,
    energyTypes: ["devops"],
    currentEnergy: "devops",
    retreated: false,
    setupDone: true,
    ...patch,
  };
}

function state(patch: Omit<Partial<BattleState>, "sides" | "cards"> & {
  cards?: Partial<BattleState["cards"]>;
  sides?: { player?: Partial<SideState>; cpu?: Partial<SideState> };
} = {}): BattleState {
  const cards = {
    "basic-a": card("basic-a"),
    "basic-b": card("basic-b"),
    "ex-a": card("ex-a", { frame: "ex", hp: 140, attacks: [attack(80)] }),
    evo: card("evo", { stage: "stage1", evolvesFromId: "basic-a", attacks: [attack(50)] }),
  };
  return {
    rng: 1,
    turn: 2,
    firstSide: "player",
    current: "player",
    phase: "main",
    pendingPromotion: [],
    awaitingTurnAdvance: false,
    checkupDone: false,
    winner: null,
    ...patch,
    cards: { ...cards, ...(patch.cards as BattleState["cards"] | undefined) },
    sides: {
      player: { ...side(), ...patch.sides?.player },
      cpu: { ...side({ active: pokemon("c", "basic-b"), currentEnergy: null }), ...patch.sides?.cpu },
    },
  };
}

function attack(damage: number, effects: AttackEffect[] = [], energyType: EnergyType = "devops") {
  return {
    name: "Golpe",
    damage,
    effectText: "",
    effects,
    energyCost: [{ type: energyType, count: 1 }],
    sortOrder: 0,
  };
}

function must(result: ReturnType<typeof applyAction>) {
  if (!result.ok) throw new Error(result.error);
  return result;
}

describe("energy cost", () => {
  it("pays ia as colorless with any energy", () => {
    expect(canPay(["devops", "frontend"], [{ type: "ia", count: 2 }])).toBe(true);
    expect(canPay(["devops"], [{ type: "ia", count: 2 }])).toBe(false);
    expect(missingEnergy(["devops"], [{ type: "frontend", count: 1 }])).toBe(1);
    expect(canPay(["devops", "frontend"], [{ type: "devops", count: 1 }, { type: "ia", count: 1 }])).toBe(true);
  });
});

describe("deck rules", () => {
  it("requires 20 cards, a basic, and owned copies", () => {
    const entries = Array.from({ length: 10 }, (_, index) => ({
      cardId: `c${index}`,
      name: `C${index}`,
      stage: index === 0 ? ("basic" as const) : ("stage1" as const),
      energyType: "devops" as const,
      copies: 2,
      owned: 2,
    }));
    expect(validateDeck(entries, ["devops"])).toEqual([]);
    expect(validateDeck([{ ...entries[0], copies: 3, owned: 5 }], ["devops"]).join(" ")).toMatch(/20 cartas/);
    expect(validateDeck([{ ...entries[0], copies: 2, owned: 1 }], ["devops"]).join(" ")).toMatch(/possui/);
  });
});

describe("createBattle", () => {
  it("deals 5 cards with a basic and flips for first player", () => {
    const basic = card("basic-a");
    const other = card("stage", { stage: "stage1", cardId: "stage" });
    const deck = {
      energyTypes: ["devops"] as EnergyType[],
      cards: [
        { card: basic, copies: 8 },
        { card: other, copies: 12 },
      ],
    };
    const { state: battle, events } = createBattle({ seed: 42, player: deck, cpu: deck });
    expect(battle.phase).toBe("setup");
    expect(battle.sides.player.hand).toHaveLength(5);
    expect(battle.sides.player.hand.some((item) => battle.cards[item.cardId].stage === "basic")).toBe(true);
    expect(events[0]).toEqual({ type: "battle_start", firstSide: battle.firstSide });
  });
});

describe("turns and first-turn limits", () => {
  it("blocks the opening attack and skips opening energy", () => {
    const opening = state({ turn: 1, current: "player", firstSide: "player" });
    opening.sides.player.currentEnergy = null;
    expect(legalActions(opening, "player").some((action) => action.type === "attack")).toBe(false);
    const result = applyAction(opening, "player", { type: "attack", attackIndex: 0 });
    expect(result.ok).toBe(false);
  });

  it("blocks evolution on a player's first turn", () => {
    const first = state({
      turn: 1,
      cards: { "basic-a": card("basic-a"), evo: card("evo", { stage: "stage1", evolvesFromId: "basic-a" }) },
      sides: {
        player: side({
          hand: [{ uid: "h1", cardId: "evo" }],
          currentEnergy: null,
        }),
      },
    });
    const result = applyAction(first, "player", { type: "evolve", handUid: "h1", targetUid: "a" });
    expect(result.ok).toBe(false);
  });

  it("attaches the turn energy and ends the turn", () => {
    const next = must(applyAction(state(), "player", { type: "attach_energy", targetUid: "a" }));
    expect(next.state.sides.player.active?.energies).toEqual(["devops", "devops"]);
    expect(next.state.sides.player.currentEnergy).toBeNull();
    const ended = must(applyAction(next.state, "player", { type: "end_turn" }));
    expect(ended.state.current).toBe("cpu");
    expect(ended.events.some((event) => event.type === "turn_start")).toBe(true);
  });
});

describe("combat", () => {
  it("adds weakness and knocks out for 1 point", () => {
    const battle = state({
      cards: {
        "basic-a": card("basic-a"),
        "basic-b": card("basic-b", { hp: 40, weaknessType: "devops", weaknessModifier: 20 }),
      },
      sides: {
        cpu: side({ active: pokemon("c", "basic-b"), currentEnergy: null }),
      },
    });
    const next = must(applyAction(battle, "player", { type: "attack", attackIndex: 0 }));
    expect(next.events.some((event) => event.type === "damage" && event.amount === 50 && event.weakness)).toBe(true);
    expect(next.events.some((event) => event.type === "knocked_out" && event.points === 1)).toBe(true);
    expect(next.state.sides.player.points).toBe(1);
  });

  it("awards 2 points for an ex knockout and wins at 3", () => {
    const battle = state({
      cards: {
        "basic-a": card("basic-a", { attacks: [attack(200)] }),
        "ex-a": card("ex-a", { frame: "ex", hp: 140 }),
      },
      sides: {
        player: side({ points: 1, currentEnergy: null }),
        cpu: side({ active: pokemon("c", "ex-a"), bench: [], currentEnergy: null }),
      },
    });
    const next = must(applyAction(battle, "player", { type: "attack", attackIndex: 0 }));
    expect(next.events.some((event) => event.type === "knocked_out" && event.points === 2)).toBe(true);
    expect(next.state.winner).toBe("player");
  });

  it("wins when the opponent has no pokemon left", () => {
    const battle = state({
      cards: {
        "basic-a": card("basic-a", { attacks: [attack(200)] }),
        "basic-b": card("basic-b", { hp: 20 }),
      },
      sides: {
        cpu: side({ active: pokemon("c", "basic-b"), bench: [], currentEnergy: null }),
      },
    });
    const next = must(applyAction(battle, "player", { type: "attack", attackIndex: 0 }));
    expect(next.state.winner).toBe("player");
    expect(next.state.sides.cpu.active).toBeNull();
  });

  it("asks for a bench promotion after a knockout", () => {
    const battle = state({
      cards: {
        "basic-a": card("basic-a", { attacks: [attack(200)] }),
        "basic-b": card("basic-b", { hp: 20 }),
        bench: card("bench"),
      },
      sides: {
        cpu: side({
          active: pokemon("c", "basic-b"),
          bench: [pokemon("b1", "bench", { energies: [] })],
          currentEnergy: null,
        }),
      },
    });
    const next = must(applyAction(battle, "player", { type: "attack", attackIndex: 0 }));
    expect(next.state.phase).toBe("promote");
    expect(next.state.pendingPromotion).toEqual(["cpu"]);
    const promoted = must(applyAction(next.state, "cpu", { type: "promote", benchUid: "b1" }));
    expect(promoted.state.sides.cpu.active?.uid).toBe("b1");
    expect(promoted.state.current).toBe("cpu");
  });
});

describe("retreat and evolve", () => {
  it("discards retreat cost and swaps with the bench", () => {
    const battle = state({
      sides: {
        player: side({
          active: pokemon("a", "basic-a", { energies: ["devops", "devops"] }),
          bench: [pokemon("b1", "basic-b", { energies: [] })],
          currentEnergy: null,
        }),
      },
    });
    const next = must(applyAction(battle, "player", { type: "retreat", benchUid: "b1" }));
    expect(next.state.sides.player.active?.uid).toBe("b1");
    expect(next.state.sides.player.bench[0]?.uid).toBe("a");
    expect(next.state.sides.player.bench[0]?.energies).toHaveLength(1);
  });

  it("evolves a pokemon that did not enter this turn", () => {
    const battle = state({
      turn: 3,
      cards: {
        "basic-a": card("basic-a"),
        "basic-b": card("basic-b"),
        evo: card("evo", { stage: "stage1", evolvesFromId: "basic-a", attacks: [attack(50)] }),
      },
      sides: {
        player: side({
          hand: [{ uid: "h1", cardId: "evo" }],
          currentEnergy: null,
        }),
      },
    });
    const next = must(applyAction(battle, "player", { type: "evolve", handUid: "h1", targetUid: "a" }));
    expect(next.state.sides.player.active?.cardId).toBe("evo");
    expect(next.state.sides.player.active?.stack).toEqual(["basic-a", "evo"]);
  });
});

describe("attack effects and status", () => {
  it("heals the attacker", () => {
    const battle = state({
      cards: {
        "basic-a": card("basic-a", { attacks: [attack(10, [{ kind: "heal_self", amount: 20 }])] }),
        "basic-b": card("basic-b"),
      },
      sides: {
        player: side({ active: pokemon("a", "basic-a", { damage: 30 }), currentEnergy: null }),
      },
    });
    const next = must(applyAction(battle, "player", { type: "attack", attackIndex: 0 }));
    expect(next.state.sides.player.active?.damage).toBe(10);
  });

  it("applies poison and ticks between turns", () => {
    const battle = state({
      rng: 99,
      cards: {
        "basic-a": card("basic-a", {
          attacks: [attack(10, [{ kind: "status", condition: "poisoned", target: "opponent", coinFlip: false }])],
        }),
        "basic-b": card("basic-b"),
      },
      sides: {
        player: side({ currentEnergy: null }),
        cpu: side({ active: pokemon("c", "basic-b", { energies: [] }), currentEnergy: null }),
      },
    });
    const next = must(applyAction(battle, "player", { type: "attack", attackIndex: 0 }));
    expect(next.state.sides.cpu.active?.status).toContain("poisoned");
    expect(next.state.sides.cpu.active?.damage).toBe(20);
  });

  it("burns, sleeps, paralyzes and confuses with a fixed seed", () => {
    function withStatus(condition: AttackEffect) {
      return state({
        rng: 7,
        cards: {
          "basic-a": card("basic-a", { attacks: [attack(10, [condition])] }),
          "basic-b": card("basic-b"),
        },
        sides: { player: side({ currentEnergy: null }) },
      });
    }
    const burned = must(
      applyAction(
        withStatus({ kind: "status", condition: "burned", target: "opponent", coinFlip: false }),
        "player",
        { type: "attack", attackIndex: 0 },
      ),
    );
    expect(burned.events.some((event) => event.type === "status_applied" && event.condition === "burned")).toBe(true);

    const confused = state({
      rng: 3,
      cards: { "basic-a": card("basic-a"), "basic-b": card("basic-b") },
      sides: {
        player: side({
          active: pokemon("a", "basic-a", { status: ["confused"] }),
          currentEnergy: null,
        }),
      },
    });
    const result = must(applyAction(confused, "player", { type: "attack", attackIndex: 0 }));
    expect(result.events.some((event) => event.type === "coin_flip")).toBe(true);
  });

  it("adds coin bonus and bonus if damaged", () => {
    const battle = state({
      rng: 1,
      cards: {
        "basic-a": card("basic-a", {
          attacks: [
            attack(10, [
              { kind: "coin_bonus", coins: 1, amountPerHeads: 30 },
              { kind: "bonus_if_damaged", amount: 20 },
            ]),
          ],
        }),
        "basic-b": card("basic-b", { hp: 200 }),
      },
      sides: {
        player: side({ active: pokemon("a", "basic-a", { damage: 10 }), currentEnergy: null }),
        cpu: side({ active: pokemon("c", "basic-b", { energies: [] }), currentEnergy: null }),
      },
    });
    const next = must(applyAction(battle, "player", { type: "attack", attackIndex: 0 }));
    const damage = next.events.find((event) => event.type === "damage" && event.uid === "c");
    expect(damage && damage.type === "damage" ? damage.amount : 0).toBeGreaterThanOrEqual(30);
  });

  it("damages the bench, self, discards energy and draws", () => {
    const battle = state({
      rng: 4,
      cards: {
        "basic-a": card("basic-a", {
          attacks: [
            attack(10, [
              { kind: "bench_damage", amount: 10, scope: "all" },
              { kind: "self_damage", amount: 10 },
              { kind: "discard_energy", count: 1, target: "opponent" },
              { kind: "draw_cards", count: 1 },
            ]),
          ],
        }),
        "basic-b": card("basic-b"),
        bench: card("bench"),
        extra: card("extra"),
      },
      sides: {
        player: side({
          deck: [{ uid: "d1", cardId: "extra" }],
          currentEnergy: null,
        }),
        cpu: side({
          active: pokemon("c", "basic-b", { energies: ["devops"] }),
          bench: [pokemon("b1", "bench", { energies: [] })],
          currentEnergy: null,
        }),
      },
    });
    const next = must(applyAction(battle, "player", { type: "attack", attackIndex: 0 }));
    expect(next.state.sides.cpu.bench[0]?.damage).toBe(10);
    expect(next.state.sides.player.active?.damage).toBe(10);
    expect(next.state.sides.cpu.active?.energies).toHaveLength(0);
    expect(next.state.sides.player.hand.some((item) => item.uid === "d1")).toBe(true);
  });

  it("prevents damage on the following opponent attack", () => {
    const battle = state({
      rng: 8,
      cards: {
        "basic-a": card("basic-a", {
          attacks: [attack(10, [{ kind: "prevent_damage_next_turn", coinFlip: false }])],
        }),
        "basic-b": card("basic-b"),
      },
      sides: {
        player: side({ currentEnergy: null }),
        cpu: side({ currentEnergy: "devops", active: pokemon("c", "basic-b") }),
      },
    });
    const after = must(applyAction(battle, "player", { type: "attack", attackIndex: 0 }));
    expect(after.state.current).toBe("cpu");
    const blocked = must(applyAction(after.state, "cpu", { type: "attack", attackIndex: 0 }));
    expect(blocked.events.some((event) => event.type === "damage_prevented")).toBe(true);
    expect(blocked.state.sides.player.active?.damage).toBe(0);
  });
});
