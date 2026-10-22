import { describe, expect, it } from "vitest";
import type { FighterAction } from "@/lib/arena/fighter";

import { ARENA_FIGHTERS, findFighter } from "./index";

const ACTIONS: FighterAction[] = ["idle", "walk", "attack", "shoot", "hurt"];

describe("ARENA_FIGHTERS", () => {
  it("tem ids únicos", () => {
    const ids = ARENA_FIGHTERS.map((fighter) => fighter.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(ARENA_FIGHTERS.map((fighter) => [fighter.id, fighter] as const))(
    "%s tem atributos e folhas válidas",
    (_, fighter) => {
      expect(fighter.hp).toBeGreaterThan(0);
      expect(fighter.attacks.melee.power).toBeGreaterThan(0);
      expect(fighter.attacks.fire.power).toBeGreaterThan(0);
      ACTIONS.forEach((action) => {
        const sheet = fighter.sprite.sheets[action];
        if (!sheet) {
          expect(action).toBe("shoot");
          return;
        }
        expect(sheet.frames).toBeGreaterThan(0);
        expect(sheet.frames).toBeLessThanOrEqual(fighter.sprite.columns);
        Object.values(sheet.rows).forEach((row) => expect(row).toBeGreaterThan(0));
      });
    },
  );
});

describe("findFighter", () => {
  it("acha pelo id e devolve null para id desconhecido", () => {
    expect(findFighter("calvossauro")?.name).toBe("Calvossauro");
    expect(findFighter("missingno")).toBeNull();
    expect(findFighter(null)).toBeNull();
  });
});
