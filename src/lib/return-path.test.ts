import { describe, expect, it } from "vitest";
import { safeReturnPath, withReturnTo } from "./return-path";

describe("safeReturnPath", () => {
  it("keeps an internal list path and its filters", () => {
    expect(safeReturnPath("/admin/cartas?q=evoli&status=draft", "/admin/cartas")).toBe(
      "/admin/cartas?q=evoli&status=draft",
    );
  });

  it("falls back when the path leaves the app", () => {
    expect(safeReturnPath("https://evil.test/admin/cartas", "/admin/cartas")).toBe("/admin/cartas");
    expect(safeReturnPath("//evil.test/admin/cartas", "/admin/cartas")).toBe("/admin/cartas");
    expect(safeReturnPath(null, "/loja")).toBe("/loja");
  });
});

describe("withReturnTo", () => {
  it("attaches the current list location", () => {
    expect(withReturnTo("/admin/cartas/carta-1", "/admin/cartas?q=evoli")).toBe(
      "/admin/cartas/carta-1?voltar=%2Fadmin%2Fcartas%3Fq%3Devoli",
    );
  });
});
