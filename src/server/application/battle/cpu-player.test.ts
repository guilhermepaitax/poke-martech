import { describe, expect, it } from "vitest";
import { applyAction } from "@/lib/battle/apply-action";
import { createBattle } from "@/lib/battle/create-battle";
import { legalActions } from "@/lib/battle/legal-actions";
import type { BattleCardData } from "@/lib/battle/battle-state";
import { chooseCpuAction, playAuto } from "@/server/application/battle/cpu-player";
import type { EnergyType } from "@/lib/value-objects/card";

function card(id: string, stage: BattleCardData["stage"] = "basic"): BattleCardData {
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
    hp: 70,
    energyType: "devops",
    frame: "basic",
    stage,
    evolvesFrom: null,
    evolvesFromId: stage === "stage1" ? "basic" : null,
    retreatCost: 1,
    weaknessType: null,
    weaknessModifier: 20,
    flavorText: "",
    attacks: [
      {
        name: "Golpe",
        damage: 40,
        effectText: "",
        effects: [],
        energyCost: [{ type: "devops", count: 1 }],
        sortOrder: 0,
      },
    ],
  };
}

describe("cpu player", () => {
  it("only picks legal actions", () => {
    const deck = {
      energyTypes: ["devops"] as EnergyType[],
      cards: [
        { card: card("basic"), copies: 10 },
        { card: card("evo", "stage1"), copies: 10 },
      ],
    };
    let { state } = createBattle({ seed: 11, player: deck, cpu: deck });
    const setup = chooseCpuAction(state, "normal");
    expect(setup?.type).toBe("setup");
    if (setup) {
      const applied = applyAction(state, "cpu", setup);
      expect(applied.ok).toBe(true);
      if (applied.ok) state = applied.state;
    }
    const legal = legalActions(state, "cpu");
    const next = chooseCpuAction(state, "normal");
    if (next) expect(legal).toContainEqual(next);
  });

  it("finishes a cpu vs cpu battle", () => {
    const deck = {
      energyTypes: ["devops"] as EnergyType[],
      cards: [
        { card: card("basic"), copies: 12 },
        { card: card("evo", "stage1"), copies: 8 },
      ],
    };
    let { state } = createBattle({ seed: 21, player: deck, cpu: deck });
    for (let step = 0; step < 250 && !state.winner; step += 1) {
      const actor = state.phase === "setup"
        ? (!state.sides.player.setupDone ? "player" : "cpu")
        : state.phase === "promote"
          ? (state.pendingPromotion[0] ?? state.current)
          : state.current;
      const played = playAuto(state, actor, "normal");
      if (played.state === state && played.events.length === 0) break;
      state = played.state;
    }
    expect(state.winner).not.toBeNull();
    expect(state.phase).toBe("finished");
  });
});
