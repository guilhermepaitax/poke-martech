import { describe, expect, it } from "vitest";
import {
  AIM_LENGTH,
  aimTip,
  attackPower,
  applyHit,
  BEAM_RANGE,
  beamImpact,
  canAttack,
  COOLDOWN_MS,
  CRIT_CHANCE,
  CRIT_MULTIPLIER,
  crackSize,
  DAMAGE_CAP,
  DAMAGE_SCALE,
  FALLBACK_ATTACK_DAMAGE,
  firstBlockHit,
  impactTier,
  MELEE_RANGE,
  meleeConnect,
  nextReadyAt,
  PROJECTILE_SPEED,
  resolveDamage,
  rollCritical,
  selectAttack,
} from "./combat";

describe("selectAttack", () => {
  it("escolhe o ataque pela tecla", () => {
    expect(selectAttack("fire", { key: "1" })).toBe("melee");
    expect(selectAttack("melee", { key: "2" })).toBe("fire");
  });

  it("alterna com o scroll e ignora rolagem zero", () => {
    expect(selectAttack("melee", { wheel: 1 })).toBe("fire");
    expect(selectAttack("fire", { wheel: -1 })).toBe("melee");
    expect(selectAttack("melee", { wheel: 0 })).toBe("melee");
  });

  it("mantém o ataque sem input", () => {
    expect(selectAttack("fire", {})).toBe("fire");
  });
});

describe("cooldown", () => {
  it("libera o ataque quando o relógio alcança a marca", () => {
    expect(canAttack(99, 100)).toBe(false);
    expect(canAttack(100, 100)).toBe(true);
    expect(nextReadyAt(1000, COOLDOWN_MS.melee)).toBe(1560);
    expect(nextReadyAt(1000, COOLDOWN_MS.fire)).toBe(1720);
  });

  it("usa cooldowns, alcance e velocidade combinados", () => {
    expect(COOLDOWN_MS).toEqual({ melee: 560, fire: 720 });
    expect(MELEE_RANGE).toBe(88);
    expect(PROJECTILE_SPEED).toBe(480);
  });
});

describe("applyHit", () => {
  it("não aplica o mesmo acerto duas vezes", () => {
    const first = applyHit(70, 40, false);
    const second = applyHit(first.hp, 40, true);

    expect(first).toEqual({ hp: 30, applied: true, dealt: 40 });
    expect(second).toEqual({ hp: 30, applied: false, dealt: 0 });
  });

  it("trava o HP em zero e informa só o que foi tirado", () => {
    expect(applyHit(10, 40, false)).toEqual({
      hp: 0,
      applied: true,
      dealt: 10,
    });
  });

  it("ignora dano zero e alvo já sem HP", () => {
    expect(applyHit(70, 0, false)).toEqual({
      hp: 70,
      applied: false,
      dealt: 0,
    });
    expect(applyHit(0, 40, false)).toEqual({
      hp: 0,
      applied: false,
      dealt: 0,
    });
  });
});

describe("meleeConnect", () => {
  const attacker = { x: 0, y: 0 };
  const aim = { x: 1, y: 0 };

  it("acerta quem está à frente e dentro do alcance", () => {
    expect(meleeConnect(attacker, { x: 40, y: 0 }, aim, MELEE_RANGE)).toBe(
      true,
    );
    expect(meleeConnect(attacker, { x: 40, y: 40 }, aim, MELEE_RANGE)).toBe(
      true,
    );
  });

  it("erra atrás, longe, em cima do atacante ou sem mira", () => {
    expect(meleeConnect(attacker, { x: -40, y: 0 }, aim, MELEE_RANGE)).toBe(
      false,
    );
    expect(meleeConnect(attacker, { x: 100, y: 0 }, aim, MELEE_RANGE)).toBe(
      false,
    );
    expect(meleeConnect(attacker, attacker, aim, MELEE_RANGE)).toBe(false);
    expect(
      meleeConnect(attacker, { x: 40, y: 0 }, { x: 0, y: 0 }, MELEE_RANGE),
    ).toBe(false);
  });
});

describe("attackPower", () => {
  it("escala o dano da carta por tipo de ataque", () => {
    expect(DAMAGE_SCALE).toEqual({ melee: 0.3, fire: 0.18 });
    expect(attackPower("melee", 40, 200)).toBe(12);
    expect(attackPower("fire", 40, 200)).toBe(7);
  });

  it("limita o golpe a uma fração do HP máximo do alvo", () => {
    expect(DAMAGE_CAP).toEqual({ melee: 0.12, fire: 0.08 });
    expect(attackPower("melee", 120, 100)).toBe(12);
    expect(attackPower("fire", 120, 100)).toBe(8);
  });

  it("derruba em cerca de oito golpes corpo a corpo", () => {
    const hp = 100;
    const hits = Math.ceil(hp / attackPower("melee", 60, hp));
    expect(hits).toBeGreaterThanOrEqual(8);
    expect(hits).toBeLessThanOrEqual(10);
  });

  it("acerto válido causa pelo menos 1", () => {
    expect(attackPower("melee", 1, 100)).toBe(1);
    expect(attackPower("fire", 10, 5)).toBe(1);
  });

  it("carta sem dano usa o dano padrão", () => {
    expect(FALLBACK_ATTACK_DAMAGE).toBe(30);
    expect(attackPower("melee", 0, 100)).toBe(attackPower("melee", 30, 100));
    expect(attackPower("fire", 0, 100)).toBe(attackPower("fire", 30, 100));
    expect(attackPower("melee", 0, 100)).toBeGreaterThan(0);
  });
});

describe("aimTip", () => {
  it("para na ponta do mouse quando ele está dentro do alcance", () => {
    expect(aimTip({ x: 0, y: 0 }, { x: 80, y: 0 })).toEqual({
      x: 80,
      y: 0,
      reaches: true,
    });
  });

  it("trava no tamanho máximo e não segue o mouse além dele", () => {
    const tip = aimTip({ x: 0, y: 0 }, { x: 400, y: 0 });

    expect(tip).toEqual({ x: AIM_LENGTH, y: 0, reaches: false });
  });

  it("não aponta sem direção", () => {
    expect(aimTip({ x: 10, y: 10 }, { x: 10, y: 10 })).toBeNull();
  });
});

describe("firstBlockHit", () => {
  const wall = { x: 50, y: 0, width: 20, height: 20 };

  it("devolve a entrada do obstáculo que cruza o golpe", () => {
    expect(firstBlockHit({ x: 0, y: 0 }, { x: 100, y: 0 }, [wall])).toEqual({
      x: 40,
      y: 0,
      distance: 40,
    });
  });

  it("ignora obstáculo ao lado ou depois do alvo", () => {
    expect(
      firstBlockHit({ x: 0, y: 0 }, { x: 100, y: 0 }, [
        { x: 50, y: 40, width: 10, height: 10 },
      ]),
    ).toBeNull();
    expect(firstBlockHit({ x: 0, y: 0 }, { x: 30, y: 0 }, [wall])).toBeNull();
  });
});

describe("beamImpact", () => {
  const wall = { x: 120, y: 0, width: 20, height: 40 };

  it("para na parede que está antes do adversário", () => {
    const impact = beamImpact(
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      BEAM_RANGE,
      [wall],
      { x: 300, y: 0 },
      36,
    );

    expect(impact.stop).toBe("block");
    expect(impact.distance).toBeCloseTo(110);
    expect(impact.x).toBeCloseTo(110);
    expect(impact.y).toBeCloseTo(0);
  });

  it("acerta o adversário quando o caminho está livre", () => {
    const impact = beamImpact(
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      BEAM_RANGE,
      [],
      { x: 200, y: 0 },
      36,
    );

    expect(impact.stop).toBe("fighter");
    expect(impact.distance).toBeCloseTo(164);
    expect(impact.x).toBeCloseTo(164);
  });

  it("segue até o alcance quando não encontra ninguém", () => {
    const beside = beamImpact(
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      100,
      [],
      { x: 200, y: 80 },
      20,
    );
    const beyond = beamImpact(
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      100,
      [],
      { x: 400, y: 0 },
      20,
    );

    expect(beside).toEqual({ x: 100, y: 0, distance: 100, stop: "range" });
    expect(beyond).toEqual({ x: 100, y: 0, distance: 100, stop: "range" });
  });
});

describe("crackSize", () => {
  it("cresce com o dano e para no piso e no teto", () => {
    const low = crackSize(0);
    const mid = crackSize(10);
    const high = crackSize(10_000);

    expect(low).toEqual(crackSize(-8));
    expect(mid.radius).toBeGreaterThan(low.radius);
    expect(high.radius).toBeGreaterThan(mid.radius);
    expect(high.radius).toBe(crackSize(50_000).radius);
    expect(mid.branches).toBeGreaterThanOrEqual(low.branches);
    expect(high.branches).toBeGreaterThan(low.branches);
    expect(high.branches).toBe(crackSize(50_000).branches);
  });
});

describe("rollCritical", () => {
  it("é crítico quando o sorteio fica abaixo da chance", () => {
    expect(rollCritical(() => CRIT_CHANCE - 0.01)).toBe(true);
    expect(rollCritical(() => CRIT_CHANCE)).toBe(false);
  });

  it("nunca é crítico com chance zero", () => {
    expect(rollCritical(() => 0, 0)).toBe(false);
  });
});

describe("resolveDamage", () => {
  it("mantém o dano sem crítico", () => {
    expect(resolveDamage(30, { critical: false })).toEqual({ damage: 30, tags: [] });
  });

  it("multiplica e arredonda no crítico", () => {
    expect(resolveDamage(25, { critical: true })).toEqual({
      damage: Math.round(25 * CRIT_MULTIPLIER),
      tags: ["critical"],
    });
  });

  it("ignora dano zerado", () => {
    expect(resolveDamage(0, { critical: true })).toEqual({ damage: 0, tags: [] });
  });
});

describe("impactTier", () => {
  it("escala pelo dano", () => {
    expect(impactTier(5)).toBe("light");
    expect(impactTier(8)).toBe("medium");
    expect(impactTier(14)).toBe("heavy");
  });

  it("crítico é sempre pesado", () => {
    expect(impactTier(2, true)).toBe("heavy");
  });
});
