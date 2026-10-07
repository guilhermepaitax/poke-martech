import { describe, expect, it } from "vitest";
import { drawPack } from "@/server/application/draw-pack";
import type { DrawEntry } from "@/server/application/draw-pack";

const pool: DrawEntry[] = [
  { cardId: "common", weight: 100, rarity: "common" },
  { cardId: "rare", weight: 10, rarity: "rare" },
  { cardId: "crown", weight: 1, rarity: "crown" },
];

describe("drawPack", () => {
  it("recusa um pool menor que a quantidade", () => {
    const result = drawPack({ pool, count: 4, featuredMinRarity: null, random: () => 0 });
    expect(result).toEqual({ ok: false, reason: "pool_too_small" });
  });

  it("não repete carta", () => {
    const result = drawPack({ pool, count: 3, featuredMinRarity: null, random: () => 0 });
    expect(result.ok).toBe(true);
    if (result.ok) expect(new Set(result.cardIds).size).toBe(3);
  });

  it("reserva a última carta para a raridade mínima", () => {
    const result = drawPack({ pool, count: 2, featuredMinRarity: "crown", random: () => 0 });
    expect(result).toEqual({ ok: true, cardIds: ["common", "crown"] });
  });

  it("falha quando nenhuma carta cobre o slot de destaque", () => {
    const result = drawPack({
      pool: pool.filter((entry) => entry.rarity === "common"),
      count: 1,
      featuredMinRarity: "crown",
      random: () => 0,
    });
    expect(result).toEqual({ ok: false, reason: "featured_unavailable" });
  });

  it("respeita pesos diferentes", () => {
    const weighted: DrawEntry[] = [
      { cardId: "light", weight: 1, rarity: "common" },
      { cardId: "heavy", weight: 3, rarity: "uncommon" },
    ];
    const first = drawPack({ pool: weighted, count: 1, featuredMinRarity: null, random: () => 0 });
    const second = drawPack({ pool: weighted, count: 1, featuredMinRarity: null, random: () => 0.9 });
    expect(first).toEqual({ ok: true, cardIds: ["light"] });
    expect(second).toEqual({ ok: true, cardIds: ["heavy"] });
  });
});
