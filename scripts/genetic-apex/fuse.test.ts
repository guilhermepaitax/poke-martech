import { describe, expect, it } from "vitest";
import {
  blendName,
  composeName,
  fuseCatalog,
  pickOption,
  type FusedCard,
} from "./fuse";
import { renderFusionsMarkdown } from "./markdown";
import type { ApexCard } from "./types";

function usesMemberMark(card: FusedCard | undefined) {
  if (!card) return false;
  const base = card.name.replace(/ ex$/, "");
  const source = card.source.name.replace(/ ex$/, "");
  return card.member.stamps.some(
    (stamp) =>
      base.startsWith(stamp) ||
      (base.startsWith(source) && base.endsWith(` ${stamp}`)),
  );
}

function card(
  overrides: Partial<ApexCard> & Pick<ApexCard, "id" | "localId" | "name">,
): ApexCard {
  return {
    hp: 70,
    types: ["Grass"],
    stage: "Basic",
    evolveFrom: null,
    description: "A seed grows on its back.",
    attacks: [
      { name: "Tackle", cost: ["Colorless"], damage: "10", effect: null },
    ],
    abilities: [],
    weaknesses: [{ type: "Fire" }],
    retreat: 1,
    rarity: "One Diamond",
    imageUrl: "https://assets.tcgdex.net/en/tcgp/A1/001/high.png",
    boosters: [],
    ...overrides,
  };
}

describe("fusão das linhas evolutivas", () => {
  it("alterna o stamp no começo ou depois do nome original", () => {
    expect(blendName("Calva", "Bulbasaur", new Set())).toBe("Calvassauro");
    expect(blendName("Byda", "Pikachu", new Set())).toBe("Bydachu");
    expect(composeName("Calva", "Bulbasaur", "stamp-first", new Set())).toBe(
      "Calvassauro",
    );
    expect(composeName("Calva", "Bulbasaur", "name-first", new Set())).toBe(
      "Bulbasaur Calva",
    );
  });

  it("prende a linha do Bulbasaur no Mago e liga as evoluções", () => {
    const fused = fuseCatalog([
      card({
        id: "A1-001",
        localId: "001",
        name: "Bulbasaur",
        attacks: [
          {
            name: "Vine Whip",
            cost: ["Grass", "Colorless"],
            damage: "40",
            effect: null,
          },
        ],
      }),
      card({
        id: "A1-002",
        localId: "002",
        name: "Ivysaur",
        stage: "Stage1",
        evolveFrom: "Bulbasaur",
        hp: 90,
        rarity: "Two Diamond",
      }),
      card({
        id: "A1-003",
        localId: "003",
        name: "Venusaur",
        stage: "Stage2",
        evolveFrom: "Ivysaur",
        hp: 160,
        rarity: "Three Diamond",
        attacks: [
          {
            name: "Mega Drain",
            cost: ["Grass", "Grass", "Colorless", "Colorless"],
            damage: "80",
            effect: "Heal 30 damage from this Pokémon.",
          },
        ],
      }),
      card({
        id: "A1-004",
        localId: "004",
        name: "Venusaur ex",
        stage: "Stage2",
        evolveFrom: "Ivysaur",
        hp: 190,
        rarity: "Four Diamond",
      }),
      card({ id: "A1-024", localId: "024", name: "Tangela" }),
    ]);

    const bySource = new Map(fused.map((item) => [item.source.id, item]));
    const bulbasaur = bySource.get("A1-001");
    const ivysaur = bySource.get("A1-002");
    const venusaur = bySource.get("A1-003");
    const venusaurEx = bySource.get("A1-004");
    const tangela = bySource.get("A1-024");

    expect(bulbasaur?.member.id).toBe("mago");
    expect(usesMemberMark(bulbasaur)).toBe(true);
    expect(bulbasaur?.energyType).toBe("careca");
    expect(bulbasaur?.weaknessType).toBe("devops");
    expect(bulbasaur?.attacks[0]?.energyCost).toEqual([
      { type: "careca", count: 1 },
      { type: "ia", count: 1 },
    ]);
    expect(ivysaur?.evolvesFromSourceId).toBe("A1-001");
    expect(ivysaur?.evolvesFromSlug).toBe(bulbasaur?.slug);
    expect(ivysaur?.member.id).toBe("mago");
    expect(venusaur?.evolvesFromSourceId).toBe("A1-002");
    expect(venusaur?.stage).toBe("stage2");
    expect(venusaur?.attacks[0]?.effects).toEqual([
      { kind: "heal_self", amount: 30 },
    ]);
    expect(venusaurEx?.frame).toBe("ex");
    expect(venusaurEx?.rarity).toBe("double_rare");
    expect(venusaurEx?.evolvesFromSourceId).toBe("A1-002");
    expect(venusaurEx?.name.startsWith(`${venusaur?.name} `)).toBe(true);
    expect(tangela?.member.id).toBe("rafa");
    expect(bulbasaur?.flavorText).not.toBe(ivysaur?.flavorText);
    expect(bulbasaur?.flavorText).toContain("Bulbasaur");
    expect(ivysaur?.flavorText).toContain("Ivysaur");
    expect(bulbasaur?.flavorText.length).toBeLessThanOrEqual(280);
    expect(bulbasaur?.member.spices).toContain(
      bulbasaur?.attacks[0]?.name.split(" ")[0],
    );
    const orders = Array.from({ length: 30 }, (_, index) =>
      pickOption(
        ["stamp-first", "name-first"] as const,
        `A1-${String(index + 1).padStart(3, "0")}:order`,
      ),
    );
    expect(orders).toContain("stamp-first");
    expect(orders).toContain("name-first");
    expect(new Set(fused.map((item) => item.name)).size).toBe(fused.length);
    expect(new Set(fused.map((item) => item.slug)).size).toBe(fused.length);
    expect(
      fused.every(
        (item) => item.name.toLowerCase() !== item.source.name.toLowerCase(),
      ),
    ).toBe(true);

    const markdown = renderFusionsMarkdown(fused);
    expect(markdown).toContain(bulbasaur?.name ?? "");
    expect(markdown).toContain("Bulbasaur");
    expect(markdown).toContain("Foto: nenhuma");
    expect(markdown).toContain("Cabeça lisa");
  });

  it("liga cada Eeveelution ao Eevee do mesmo booster", () => {
    const fused = fuseCatalog([
      card({
        id: "A1-206",
        localId: "206",
        name: "Eevee",
        types: ["Colorless"],
        boosters: [{ id: "charizard", name: "Charizard" }],
      }),
      card({
        id: "A1-207",
        localId: "207",
        name: "Eevee",
        types: ["Colorless"],
        boosters: [{ id: "mewtwo", name: "Mewtwo" }],
      }),
      card({
        id: "A1-045",
        localId: "045",
        name: "Flareon",
        stage: "Stage1",
        evolveFrom: "Eevee",
        types: ["Fire"],
        rarity: "Three Diamond",
        boosters: [{ id: "charizard", name: "Charizard" }],
      }),
      card({
        id: "A1-080",
        localId: "080",
        name: "Vaporeon",
        stage: "Stage1",
        evolveFrom: "Eevee",
        types: ["Water"],
        rarity: "Three Diamond",
        boosters: [{ id: "mewtwo", name: "Mewtwo" }],
      }),
    ]);
    const bySource = new Map(fused.map((item) => [item.source.id, item]));
    expect(bySource.get("A1-045")?.evolvesFromSourceId).toBe("A1-206");
    expect(bySource.get("A1-080")?.evolvesFromSourceId).toBe("A1-207");
    expect(bySource.get("A1-045")?.stage).toBe("stage1");
    expect(bySource.get("A1-045")?.member.id).toBe(
      bySource.get("A1-206")?.member.id,
    );
    expect(bySource.get("A1-045")?.member.id).not.toBe(
      bySource.get("A1-080")?.member.id,
    );
  });

  it("deixa o fóssil jogável como Básico e separa o ex que não evolui", () => {
    const fused = fuseCatalog([
      card({
        id: "A1-081",
        localId: "081",
        name: "Omanyte",
        stage: "Stage1",
        evolveFrom: "Helix Fossil",
        rarity: "Two Diamond",
        types: ["Water"],
      }),
      card({
        id: "A1-094",
        localId: "094",
        name: "Pikachu",
        types: ["Lightning"],
      }),
      card({
        id: "A1-096",
        localId: "096",
        name: "Pikachu ex",
        types: ["Lightning"],
        rarity: "Four Diamond",
        hp: 120,
      }),
    ]);
    const bySource = new Map(fused.map((item) => [item.source.id, item]));
    expect(bySource.get("A1-081")?.stage).toBe("basic");
    expect(bySource.get("A1-081")?.evolvesFromSourceId).toBeNull();
    expect(bySource.get("A1-081")?.stageNote).toMatch(/Helix Fossil/);
    expect(bySource.get("A1-096")?.evolvesFromSourceId).toBeNull();
    expect(bySource.get("A1-096")?.frame).toBe("ex");
    expect(bySource.get("A1-096")?.member.id).not.toBe(
      bySource.get("A1-094")?.member.id,
    );
  });
});
