import { describe, expect, it } from "vitest";
import type { CardSummary } from "@/types/catalog";
import {
  filterAdminCards,
  formatAdminCardCount,
  hasActiveAdminCardFilters,
  type AdminCardFilterState,
} from "./filter-admin-cards";

const filters: AdminCardFilterState = {
  name: "",
  status: "all",
  energyType: "all",
  rarity: "all",
};

function card(overrides: Partial<CardSummary> & Pick<CardSummary, "id" | "name">): CardSummary {
  return {
    number: 1,
    slug: overrides.name,
    imageUrl: null,
    hp: 60,
    energyType: "devops",
    stage: "basic",
    rarity: "common",
    published: true,
    ...overrides,
  };
}

const catalog = [
  card({ id: "1", name: "Pikachu", energyType: "full-stack", rarity: "common", published: true }),
  card({ id: "2", name: "Charmander", energyType: "devops", rarity: "uncommon", published: false }),
  card({ id: "3", name: "Évoli", energyType: "ux-ui", rarity: "rare", published: true }),
];

describe("filterAdminCards", () => {
  it("returns every card when no filter is set", () => {
    expect(filterAdminCards(catalog, filters)).toEqual(catalog);
  });

  it("matches the name without case or accents", () => {
    expect(filterAdminCards(catalog, { ...filters, name: "  evoli " }).map((item) => item.id)).toEqual([
      "3",
    ]);
  });

  it("keeps drafts or published cards", () => {
    expect(filterAdminCards(catalog, { ...filters, status: "draft" }).map((item) => item.id)).toEqual([
      "2",
    ]);
    expect(
      filterAdminCards(catalog, { ...filters, status: "published" }).map((item) => item.id),
    ).toEqual(["1", "3"]);
  });

  it("filters by type and rarity together", () => {
    expect(
      filterAdminCards(catalog, {
        ...filters,
        energyType: "devops",
        rarity: "uncommon",
        status: "draft",
      }).map((item) => item.id),
    ).toEqual(["2"]);
  });
});

describe("admin card filter helpers", () => {
  it("detects an active filter and formats the count", () => {
    expect(hasActiveAdminCardFilters(filters)).toBe(false);
    expect(hasActiveAdminCardFilters({ ...filters, name: "a" })).toBe(true);
    expect(formatAdminCardCount(3, 3)).toBe("3 cartas");
    expect(formatAdminCardCount(1, 1)).toBe("1 carta");
    expect(formatAdminCardCount(1, 3)).toBe("1 de 3 cartas");
  });
});
