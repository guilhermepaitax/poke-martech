import { describe, expect, it } from "vitest";
import {
  canDefend,
  defendHit,
  freshGuard,
  GUARD_BREAK_MS,
  GUARD_MAX,
  GUARD_REGEN_DELAY_MS,
  guardCost,
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
    const spent = spendGuard({ meter: 10, brokenUntil: 0, usedAt: 0 }, 0, 500);
    expect(spent.broke).toBe(true);
    expect(spent.guard.meter).toBe(0);
    expect(spent.guard.brokenUntil).toBe(500 + GUARD_BREAK_MS);
    expect(canDefend(600, spent.guard)).toBe(false);
  });
});

describe("regenGuard", () => {
  it("espera um tempo sem defender antes de recarregar", () => {
    const guard = { meter: 50, brokenUntil: 0, usedAt: 1000 };
    expect(regenGuard(guard, 100, 1000 + GUARD_REGEN_DELAY_MS - 1)).toBe(guard);
    expect(regenGuard(guard, 1000, 1000 + GUARD_REGEN_DELAY_MS).meter).toBeGreaterThan(50);
  });

  it("não passa do máximo", () => {
    expect(regenGuard({ meter: 99, brokenUntil: 0, usedAt: 0 }, 10_000, 20_000).meter).toBe(GUARD_MAX);
  });

  it("guarda quebrada volta cheia quando acaba a pausa", () => {
    const broken = { meter: 0, brokenUntil: 2000, usedAt: 800 };
    expect(regenGuard(broken, 16, 1500)).toBe(broken);
    const back = regenGuard(broken, 16, 2000);
    expect(back.meter).toBe(GUARD_MAX);
    expect(canDefend(2000, back)).toBe(true);
  });
});
