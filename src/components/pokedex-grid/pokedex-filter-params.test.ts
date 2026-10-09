import { describe, expect, it } from "vitest";
import { pokedexFiltersFromSearch, pokedexListHref } from "./pokedex-filter-params";

describe("pokedex filter params", () => {
  it("reads search, type and sort from the query string", () => {
    expect(pokedexFiltersFromSearch(new URLSearchParams("q=eevee&tipo=ux-ui&ordem=hp"))).toEqual({
      query: "eevee",
      type: "ux-ui",
      sort: "hp",
    });
  });

  it("ignores unknown values and omits defaults", () => {
    expect(pokedexFiltersFromSearch(new URLSearchParams("tipo=nope&ordem=nope"))).toEqual({
      query: "",
      type: "all",
      sort: "number",
    });
    expect(
      pokedexListHref("/pokedex", new URLSearchParams("q=eevee"), {
        query: "",
        type: "all",
        sort: "number",
      }),
    ).toBe("/pokedex");
    expect(
      pokedexListHref("/u/ash", new URLSearchParams(), {
        query: "eevee",
        type: "ux-ui",
        sort: "name",
      }),
    ).toBe("/u/ash?q=eevee&tipo=ux-ui&ordem=name");
  });
});
