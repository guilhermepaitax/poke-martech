import { formatBaseUrl } from "@/lib/format-base-url";
import { describe, expect, it } from "vitest";

describe("formatBaseUrl", () => {
  it("normaliza a origem e remove a barra final", () => {
    expect(formatBaseUrl("https://poke-martech.vercel.app/")).toBe(
      "https://poke-martech.vercel.app",
    );
  });

  it("completa o protocolo quando a URL vem sem esquema", () => {
    expect(formatBaseUrl("poke-martech-abc.vercel.app")).toBe(
      "https://poke-martech-abc.vercel.app",
    );
  });

  it("retorna vazio para um valor inválido", () => {
    expect(formatBaseUrl("")).toBe("");
    expect(formatBaseUrl("not a url")).toBe("");
  });
});
