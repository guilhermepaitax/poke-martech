import { describe, expect, it } from "vitest";
import {
  evaluatePassword,
  isPasswordValid,
  unmetPasswordMessage,
} from "@/lib/password-policy";

describe("password policy", () => {
  it("rejeita senha vazia em todas as regras", () => {
    expect(evaluatePassword("").every((rule) => !rule.met)).toBe(true);
    expect(isPasswordValid("")).toBe(false);
  });

  it("aceita senha com tamanho, maiúscula, minúscula e número", () => {
    expect(isPasswordValid("Senha123")).toBe(true);
    expect(unmetPasswordMessage("Senha123")).toBeNull();
  });

  it("lista só o que ainda falta", () => {
    expect(unmetPasswordMessage("senha")).toBe(
      "A senha ainda precisa de pelo menos 8 caracteres, uma letra maiúscula, um número.",
    );
  });
});
