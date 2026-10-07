import { describe, expect, it } from "vitest";
import { parsePokemonZoneUrl } from "@/lib/value-objects/card-generation";

describe("parsePokemonZoneUrl", () => {
  it("extrai set e número de um link de carta", () => {
    expect(parsePokemonZoneUrl("https://www.pokemon-zone.com/cards/a1/143/machop/")).toEqual({
      setId: "a1",
      number: "143",
    });
  });

  it("completa o número com zeros", () => {
    expect(parsePokemonZoneUrl("https://pokemon-zone.com/cards/a1a/1/exeggcute/")).toEqual({
      setId: "a1a",
      number: "001",
    });
  });

  it("aceita sets promocionais e links sem nome", () => {
    expect(parsePokemonZoneUrl("https://www.pokemon-zone.com/cards/P-A/7")).toEqual({
      setId: "p-a",
      number: "007",
    });
  });

  it("recusa links que não são de carta", () => {
    expect(parsePokemonZoneUrl("https://www.pokemon-zone.com/decks/123/")).toBeNull();
    expect(parsePokemonZoneUrl("https://example.com/cards/a1/143/machop/")).toBeNull();
  });
});
