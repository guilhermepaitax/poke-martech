import { describe, expect, it } from "vitest";
import { artworkBox, resolveTcgdexCardId } from "@/server/infrastructure/services/tcgdex-card-source";

const setIds = ["A1", "A1a", "A2b", "P-A"];

describe("resolveTcgdexCardId", () => {
  it("usa o id do set com a capitalização da TCGdex", () => {
    expect(resolveTcgdexCardId({ setId: "a1", number: "143" }, setIds)).toBe("A1-143");
    expect(resolveTcgdexCardId({ setId: "a2b", number: "010" }, setIds)).toBe("A2b-010");
    expect(resolveTcgdexCardId({ setId: "p-a", number: "007" }, setIds)).toBe("P-A-007");
  });

  it("retorna null para set desconhecido", () => {
    expect(resolveTcgdexCardId({ setId: "z9", number: "001" }, setIds)).toBeNull();
  });
});

describe("artworkBox", () => {
  it("recorta a janela de arte das cartas com moldura", () => {
    expect(artworkBox("One Diamond", 600, 825)).toEqual({ left: 52, top: 97, width: 496, height: 291 });
  });

  it("usa a área ampla nas cartas full art", () => {
    expect(artworkBox("Four Diamond", 600, 825)).toEqual({ left: 24, top: 97, width: 552, height: 380 });
    expect(artworkBox("One Star", 600, 825)).toEqual({ left: 24, top: 97, width: 552, height: 380 });
  });
});
