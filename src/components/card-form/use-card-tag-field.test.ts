import { describe, expect, it } from "vitest";
import { cardTagChoices, matchesCardTagChoice } from "./use-card-tag-field";

const suggestions = ["Inicial", "Água", "Lendário"];

describe("cardTagChoices", () => {
  it("lists existing tags that are not on the card", () => {
    const { items } = cardTagChoices(["Inicial"], suggestions, "");
    expect(items.map((item) => item.name)).toEqual(["Água", "Lendário"]);
  });

  it("offers to create a tag that does not exist yet", () => {
    const { items } = cardTagChoices([], suggestions, "promo");
    expect(items.at(-1)).toMatchObject({
      name: 'Criar "promo"',
      creatable: "promo",
    });
  });

  it("does not offer creation when the typed tag matches an existing one", () => {
    const { items } = cardTagChoices([], suggestions, "agua");
    expect(items.map((item) => item.creatable)).toEqual([
      undefined,
      undefined,
      undefined,
    ]);
    expect(items.some((item) => item.name === "Água")).toBe(true);
  });

  it("hides creation when the tag is already on the card", () => {
    const result = cardTagChoices(["Água"], suggestions, "agua");
    expect(result.items.some((item) => item.creatable)).toBe(false);
    expect(result.emptyMessage).toBe("Essa tag já está na carta.");
  });
});

describe("matchesCardTagChoice", () => {
  it("shows every existing tag when the query is empty and keeps the create option visible", () => {
    const { items } = cardTagChoices([], suggestions, "promo");
    const visible = items.filter((item) => matchesCardTagChoice(item, "promo"));
    expect(visible.map((item) => item.name)).toEqual(['Criar "promo"']);
  });
});
