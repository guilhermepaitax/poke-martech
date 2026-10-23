import { describe, expect, it } from "vitest";
import {
  canCounter,
  canDefend,
  defendHit,
  freshGuard,
  GUARD_BREAK_MS,
  GUARD_MAX,
  GUARD_REGEN_DELAY_MS,
  guardCost,
  isParry,
  lowerGuard,
  PARRY_COOLDOWN_MS,
  PARRY_WINDOW_MS,
  raiseGuard,
  regenGuard,
  spendGuard,
} from "./defense";

describe("defendHit", () => {
  it("corta o dano e marca como bloqueado", () => {
    expect(defendHit({ damage: 20, tags: ["critical"] })).toEqual({
      damage: 6,
      tags: ["critical", "blocked"],
    });
  });

  it("nunca zera um golpe que acertou", () => {
    expect(defendHit({ damage: 1, tags: [] }).damage).toBe(1);
  });

  it("não soma resisted com blocked", () => {
    expect(defendHit({ damage: 10, tags: ["resisted"] }).tags).toEqual(["blocked"]);
  });

  it("ignora golpe sem dano", () => {
    expect(defendHit({ damage: 0, tags: [] })).toEqual({ damage: 0, tags: [] });
  });
});

describe("spendGuard", () => {
  it("golpe carregado gasta mais guarda", () => {
    expect(guardCost(2)).toBeGreaterThan(guardCost(0));
  });

  it("gasta sem quebrar enquanto sobra guarda", () => {
    const spent = spendGuard(freshGuard(), 0, 100);
    expect(spent.broke).toBe(false);
    expect(spent.guard.meter).toBe(GUARD_MAX - guardCost(0));
    expect(spent.guard.usedAt).toBe(100);
  });

  it("quebra ao zerar e bloqueia a defesa por um tempo", () => {
    const spent = spendGuard({ ...freshGuard(), meter: 10, brokenUntil: 0, usedAt: 0 }, 0, 500);
    expect(spent.broke).toBe(true);
    expect(spent.guard.meter).toBe(0);
    expect(spent.guard.brokenUntil).toBe(500 + GUARD_BREAK_MS);
    expect(canDefend(600, spent.guard)).toBe(false);
  });
});

describe("regenGuard", () => {
  it("espera um tempo sem defender antes de recarregar", () => {
    const guard = { ...freshGuard(), meter: 50, brokenUntil: 0, usedAt: 1000 };
    expect(regenGuard(guard, 100, 1000 + GUARD_REGEN_DELAY_MS - 1)).toBe(guard);
    expect(regenGuard(guard, 1000, 1000 + GUARD_REGEN_DELAY_MS).meter).toBeGreaterThan(50);
  });

  it("não passa do máximo", () => {
    expect(regenGuard({ ...freshGuard(), meter: 99, brokenUntil: 0, usedAt: 0 }, 10_000, 20_000).meter).toBe(GUARD_MAX);
  });

  it("guarda quebrada volta cheia quando acaba a pausa", () => {
    const broken = { ...freshGuard(), meter: 0, brokenUntil: 2000, usedAt: 800 };
    expect(regenGuard(broken, 16, 1500)).toBe(broken);
    const back = regenGuard(broken, 16, 2000);
    expect(back.meter).toBe(GUARD_MAX);
    expect(canDefend(2000, back)).toBe(true);
  });
});

describe("parry", () => {
  it("vale só logo depois de levantar a guarda", () => {
    const raised = raiseGuard(freshGuard(), 1000);
    expect(isParry(raised, 1000 + PARRY_WINDOW_MS)).toBe(true);
    expect(isParry(raised, 1000 + PARRY_WINDOW_MS + 1)).toBe(false);
  });

  it("guarda abaixada não faz parry", () => {
    const lowered = lowerGuard(raiseGuard(freshGuard(), 1000), 1050);
    expect(isParry(lowered, 1060)).toBe(false);
  });

  it("levantar de novo logo após baixar não abre janela", () => {
    const lowered = lowerGuard(raiseGuard(freshGuard(), 1000), 1100);
    expect(isParry(raiseGuard(lowered, 1100 + PARRY_COOLDOWN_MS - 1), 1100 + PARRY_COOLDOWN_MS)).toBe(false);
    const again = raiseGuard(lowered, 1100 + PARRY_COOLDOWN_MS);
    expect(isParry(again, 1100 + PARRY_COOLDOWN_MS + 10)).toBe(true);
  });

  it("um contra-ataque por levantar", () => {
    const raised = raiseGuard(freshGuard(), 1000);
    expect(canCounter(raised)).toBe(true);
    const countered = { ...raised, counteredAt: 1050 };
    expect(canCounter(countered)).toBe(false);
    expect(canCounter(raiseGuard(lowerGuard(countered, 1100), 2000))).toBe(true);
  });

  it("janela própria vale só para aquele levantar", () => {
    const long = raiseGuard(freshGuard(), 1000, 400);
    expect(isParry(long, 1400)).toBe(true);
    const normal = raiseGuard(lowerGuard(long, 1500), 3000);
    expect(isParry(normal, 3000 + PARRY_WINDOW_MS + 1)).toBe(false);
  });

  it("gastar guarda mantém a janela de parry", () => {
    const raised = raiseGuard(freshGuard(), 1000);
    expect(isParry(spendGuard(raised, 0, 1010).guard, 1020)).toBe(true);
  });
});
