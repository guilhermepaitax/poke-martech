import { describe, expect, it } from "vitest";
import {
  allVisibleCardsSelected,
  filterBoosterCatalog,
  formatBoosterSelection,
  selectVisibleCards,
} from "./filter-booster-cards";

const catalog = [
  {
    id: "1",
    name: "Pikachu",
    energyType: "full-stack" as const,
    tags: ["inicial"],
  },
  {
    id: "2",
    name: "Charmander",
    energyType: "devops" as const,
    tags: ["fogo"],
  },
  {
    id: "3",
    name: "Squirtle",
    energyType: "ux-ui" as const,
    tags: ["água", "inicial"],
  },
];

describe("filterBoosterCatalog", () => {
  it("filters by name, type and tag together", () => {
    expect(
      filterBoosterCatalog(catalog, {
        name: "squ",
        energyTypes: ["ux-ui"],
        tags: ["inicial"],
      }).map((card) => card.id),
    ).toEqual(["3"]);
  });

  it("keeps every card when the filters are empty", () => {
    expect(
      filterBoosterCatalog(catalog, { name: "", energyTypes: [], tags: [] }),
    ).toEqual(catalog);
  });
});

describe("formatBoosterSelection", () => {
  it("states the pack total and how many filtered cards are already in it", () => {
    expect(formatBoosterSelection(0, 0, 10, 40)).toEqual({
      count: "0",
      title: "cartas no pacote",
      detail: "Nenhuma carta entrou no pacote.",
    });
    expect(formatBoosterSelection(12, 12, 40, 40)).toEqual({
      count: "12",
      title: "cartas no pacote",
      detail: null,
    });
    expect(formatBoosterSelection(12, 3, 8, 40)).toEqual({
      count: "12",
      title: "cartas no pacote",
      detail: "3 das 8 filtradas",
    });
    expect(formatBoosterSelection(1, 1, 40, 40).title).toBe("carta no pacote");
  });
});

describe("selectVisibleCards", () => {
  it("adds the visible cards and clears only those cards when they are all selected", () => {
    const selected = selectVisibleCards(
      [{ cardId: "9", weightOverride: 2 }],
      ["1", "2"],
    );
    expect(selected).toEqual([
      { cardId: "9", weightOverride: 2 },
      { cardId: "1", weightOverride: null },
      { cardId: "2", weightOverride: null },
    ]);
    expect(allVisibleCardsSelected(selected, ["1", "2"])).toBe(true);
    expect(selectVisibleCards(selected, ["1", "2"])).toEqual([
      { cardId: "9", weightOverride: 2 },
    ]);
  });
});
