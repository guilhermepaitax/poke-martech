import { describe, expect, it } from "vitest";
import { cardMatchesTags, normalizeCardTags } from "./card-tag";

describe("normalizeCardTags", () => {
  it("trims, collapses spaces and drops empties", () => {
    expect(normalizeCardTags(["  inicial  ", "  ", "lendário  raro"])).toEqual([
      "inicial",
      "lendário raro",
    ]);
  });

  it("keeps the first spelling when tags match without case or accents", () => {
    expect(normalizeCardTags(["Fógo", "fogo", "FOGO"])).toEqual(["Fógo"]);
  });

  it("ignores commas, oversized tags and tags past the limit", () => {
    const tags = Array.from({ length: 14 }, (_, index) => `tag-${index}`);
    expect(normalizeCardTags([...tags, "a,b", "x".repeat(33)])).toEqual(tags.slice(0, 12));
  });
});

describe("cardMatchesTags", () => {
  it("matches any selected tag and skips the filter when none is selected", () => {
    expect(cardMatchesTags(["inicial", "fogo"], [])).toBe(true);
    expect(cardMatchesTags(["inicial"], ["fogo", "Inicial"])).toBe(true);
    expect(cardMatchesTags(["água"], ["fogo"])).toBe(false);
  });
});
