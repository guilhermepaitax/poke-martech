import { describe, expect, it } from "vitest";
import {
  AIM_LENGTH,
  aimTip,
  attackPower,
  applyHit,
  BEAM_RANGE,
  beamImpact,
  BONE_RANGE,
  BONE_SPREAD,
  boneStep,
  boneVolley,
  BUBBLE_SPREAD,
  BUBBLE_STAGGER_MS,
  BUBBLE_WOBBLE,
  bubbleOffset,
  bubblePosition,
  bubbleVolley,
  canAttack,
  COOLDOWN_MS,
  CRIT_CHANCE,
  CRIT_MULTIPLIER,
  crackSize,
  DAMAGE_CAP,
  DAMAGE_SCALE,
  FALLBACK_ATTACK_DAMAGE,
  firstBlockHit,
  guardHit,
  impactTier,
  MELEE_RANGE,
  meleeConnect,
  ORB_SPREAD,
  orbVolley,
  nextReadyAt,
  PROJECTILE_SPEED,
  resolveDamage,
  rollCritical,
  selectAttack,
  spinConnect,
  STAR_SPREAD,
  starVolley,
  steerToward,
  throwBone,
  type Rect,
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
    expect(nextReadyAt(1000, COOLDOWN_MS.melee)).toBe(1460);
    expect(nextReadyAt(1000, COOLDOWN_MS.fire)).toBe(1720);
  });

  it("usa cooldowns, alcance e velocidade combinados", () => {
    expect(COOLDOWN_MS).toEqual({ melee: 460, fire: 720 });
    expect(MELEE_RANGE).toBe(124);
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
    expect(meleeConnect(attacker, { x: 140, y: 0 }, aim, MELEE_RANGE)).toBe(
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
    expect(DAMAGE_SCALE).toEqual({ melee: 0.4, fire: 0.18 });
    expect(attackPower("melee", 40, 200)).toBe(16);
    expect(attackPower("fire", 40, 200)).toBe(7);
  });

  it("limita o golpe a uma fração do HP máximo do alvo", () => {
    expect(DAMAGE_CAP).toEqual({ melee: 0.16, fire: 0.08 });
    expect(attackPower("melee", 120, 100)).toBe(16);
    expect(attackPower("fire", 120, 100)).toBe(8);
  });

  it("derruba em cerca de sete golpes corpo a corpo", () => {
    const hp = 100;
    const hits = Math.ceil(hp / attackPower("melee", 60, hp));
    expect(hits).toBeGreaterThanOrEqual(6);
    expect(hits).toBeLessThanOrEqual(8);
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

describe("guardHit", () => {
  it("corta o dano à distância pela metade durante o golpe", () => {
    expect(guardHit({ damage: 10, tags: ["critical"] }, true)).toEqual({
      damage: 5,
      tags: ["critical", "resisted"],
    });
    expect(guardHit({ damage: 1, tags: [] }, true).damage).toBe(1);
  });

  it("sem guarda mantém o golpe", () => {
    const hit = { damage: 10, tags: [] };
    expect(guardHit(hit, false)).toBe(hit);
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
      index: 0,
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
    expect(impact.block).toBe(0);
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

describe("orbVolley", () => {
  it("lança uma bola na mira nos níveis 0 e 1", () => {
    expect(orbVolley({ x: 3, y: 0 }, 0)).toEqual([{ x: 1, y: 0 }]);
    expect(orbVolley({ x: 0, y: -2 }, 1)).toEqual([{ x: 0, y: -1 }]);
  });

  it("lança três bolas no nível 2, centro e duas diagonais", () => {
    const [center, left, right] = orbVolley({ x: 1, y: 0 }, 2);
    expect(center).toEqual({ x: 1, y: 0 });
    for (const shot of [left, right]) {
      expect(Math.hypot(shot!.x, shot!.y)).toBeCloseTo(1);
      expect(Math.abs(Math.atan2(shot!.y, shot!.x))).toBeCloseTo(ORB_SPREAD);
    }
    expect(Math.sign(left!.y)).toBe(-Math.sign(right!.y));
  });

  it("não lança sem mira", () => {
    expect(orbVolley({ x: 0, y: 0 }, 2)).toEqual([]);
  });
});

describe("boneVolley", () => {
  it("lança um osso na mira nos níveis 0 e 1", () => {
    expect(boneVolley({ x: 4, y: 0 }, 0)).toEqual([{ x: 1, y: 0 }]);
    expect(boneVolley({ x: 0, y: 2 }, 1)).toEqual([{ x: 0, y: 1 }]);
  });

  it("lança dois ossos em leque no nível 2", () => {
    const [left, right] = boneVolley({ x: 1, y: 0 }, 2);
    expect(left?.x).toBeCloseTo(Math.cos(BONE_SPREAD));
    expect(left?.y).toBeCloseTo(-Math.sin(BONE_SPREAD));
    expect(right?.y).toBeCloseTo(Math.sin(BONE_SPREAD));
  });

  it("não lança sem direção", () => {
    expect(boneVolley({ x: 0, y: 0 }, 2)).toEqual([]);
  });
});

describe("starVolley", () => {
  it("lança 2, 3 e 5 estrelas por nível de carga", () => {
    expect(starVolley({ x: 1, y: 0 }, 0)).toHaveLength(2);
    expect(starVolley({ x: 1, y: 0 }, 1)).toHaveLength(3);
    expect(starVolley({ x: 1, y: 0 }, 2)).toHaveLength(5);
  });

  it("abre o leque simétrico em volta da mira, com vetores unitários", () => {
    const stars = starVolley({ x: 0, y: 4 }, 1);
    stars.forEach((star) => expect(Math.hypot(star.x, star.y)).toBeCloseTo(1));
    const [left, center, right] = stars;
    expect(center?.x).toBeCloseTo(0);
    expect(center?.y).toBeCloseTo(1);
    expect(Math.atan2(right?.y ?? 0, right?.x ?? 0) - Math.PI / 2).toBeCloseTo(STAR_SPREAD);
    expect(Math.atan2(left?.y ?? 0, left?.x ?? 0) - Math.PI / 2).toBeCloseTo(-STAR_SPREAD);
  });

  it("não lança sem mira", () => {
    expect(starVolley({ x: 0, y: 0 }, 2)).toEqual([]);
  });
});

describe("bubbleVolley", () => {
  it("lança 3 bolhas em fila e um leque de 5 na carga 2", () => {
    const line = bubbleVolley({ x: 3, y: 0 }, 0);
    expect(line).toHaveLength(3);
    line.forEach((bubble, index) => {
      expect(bubble.direction).toEqual({ x: 1, y: 0 });
      expect(bubble.delayMs).toBe(index * BUBBLE_STAGGER_MS);
    });
    expect(bubbleVolley({ x: 1, y: 0 }, 1)).toHaveLength(3);
    const fan = bubbleVolley({ x: 0, y: 2 }, 2);
    expect(fan).toHaveLength(5);
    fan.forEach((bubble) => {
      expect(bubble.delayMs).toBe(0);
      expect(Math.hypot(bubble.direction.x, bubble.direction.y)).toBeCloseTo(1);
    });
    const first = fan[0]?.direction ?? { x: 0, y: 0 };
    expect(Math.atan2(first.y, first.x) - Math.PI / 2).toBeCloseTo(-2 * BUBBLE_SPREAD);
  });

  it("alterna o sentido da ondulação", () => {
    expect(bubbleVolley({ x: 1, y: 0 }, 0).map((bubble) => bubble.sway)).toEqual([1, -1, 1]);
  });

  it("não lança sem mira", () => {
    expect(bubbleVolley({ x: 0, y: 0 }, 1)).toEqual([]);
  });
});

describe("bubblePosition", () => {
  it("sai da boca sem desvio e ondula de lado dentro da amplitude", () => {
    const from = { x: 10, y: 20 };
    expect(bubblePosition(from, { x: 1, y: 0 }, 0, 1)).toEqual({ x: 10, y: 20 });
    for (let travelled = 0; travelled <= 600; travelled += 25) {
      const point = bubblePosition(from, { x: 1, y: 0 }, travelled, -1);
      expect(point.x).toBeCloseTo(10 + travelled);
      expect(Math.abs(point.y - 20)).toBeLessThanOrEqual(BUBBLE_WOBBLE + 1e-9);
    }
  });

  it("ondula em sentidos opostos conforme o sway", () => {
    expect(bubbleOffset(40, 1)).toBeCloseTo(-bubbleOffset(40, -1));
  });
});

describe("spinConnect", () => {
  it("acerta em qualquer direção dentro do raio", () => {
    expect(spinConnect({ x: 0, y: 0 }, { x: -50, y: 0 }, 100)).toBe(true);
    expect(spinConnect({ x: 0, y: 0 }, { x: 0, y: 80 }, 100)).toBe(true);
  });

  it("erra fora do raio ou sobreposto", () => {
    expect(spinConnect({ x: 0, y: 0 }, { x: 120, y: 0 }, 100)).toBe(false);
    expect(spinConnect({ x: 0, y: 0 }, { x: 0, y: 0 }, 100)).toBe(false);
  });
});

describe("steerToward", () => {
  it("gira no máximo o limite em direção ao alvo", () => {
    const next = steerToward({ x: 1, y: 0 }, { x: 0, y: 10 }, 0.2);
    expect(Math.atan2(next.y, next.x)).toBeCloseTo(0.2);
    const back = steerToward({ x: 1, y: 0 }, { x: 0, y: -10 }, 0.2);
    expect(Math.atan2(back.y, back.x)).toBeCloseTo(-0.2);
  });

  it("alinha com o alvo quando o ângulo cabe no limite", () => {
    const next = steerToward({ x: 1, y: 0 }, { x: 10, y: 1 }, 0.5);
    expect(Math.atan2(next.y, next.x)).toBeCloseTo(Math.atan2(1, 10));
  });

  it("mantém o rumo sem alvo", () => {
    expect(steerToward({ x: 0, y: 1 }, null, 1)).toEqual({ x: 0, y: 1 });
    expect(steerToward({ x: 0, y: 1 }, { x: 0, y: 0 }, 1)).toEqual({ x: 0, y: 1 });
  });
});

describe("boneStep", () => {
  const owner = { x: 0, y: 0 };

  function fly(target: { x: number; y: number } | null, blocks: Rect[] = [], steps = 200) {
    let flight = throwBone(owner, { x: 1, y: 0 });
    const hits: string[] = [];
    let done = false;
    for (let index = 0; index < steps && flight && !done; index += 1) {
      const result = boneStep(flight, 20, owner, target, blocks);
      if (result.hit) hits.push(`${result.hit.stop}:${flight.phase}`);
      flight = result.flight;
      done = result.done;
    }
    return { flight, hits, done };
  }

  it("vai até o alcance, volta e é pego pelo dono", () => {
    let flight = throwBone(owner, { x: 1, y: 0 });
    if (!flight) throw new Error("sem osso");
    flight = boneStep(flight, BONE_RANGE + 50, owner, null, []).flight;
    expect(flight.phase).toBe("back");
    expect(flight.x).toBeCloseTo(BONE_RANGE);
    const result = fly(null);
    expect(result.done).toBe(true);
    expect(result.hits).toEqual([]);
  });

  it("acerta o alvo uma vez na ida e uma vez na volta", () => {
    const result = fly({ x: 200, y: 0 });
    expect(result.hits).toEqual(["fighter:out", "fighter:back"]);
    expect(result.done).toBe(true);
  });

  it("para ao bater em obstáculo", () => {
    const result = fly({ x: 300, y: 0 }, [{ x: 150, y: 0, width: 40, height: 40 }]);
    expect(result.hits).toEqual(["block:out"]);
    expect(result.done).toBe(true);
    expect(result.flight?.x).toBeCloseTo(130);
  });

  it("devolve o impacto no obstáculo", () => {
    const flight = throwBone(owner, { x: 1, y: 0 });
    if (!flight) throw new Error("sem osso");
    const result = boneStep(flight, 200, owner, null, [{ x: 150, y: 0, width: 40, height: 40 }]);
    expect(result.hit?.stop).toBe("block");
    expect(result.hit?.block).toBe(0);
  });

  it("não lança sem direção", () => {
    expect(throwBone(owner, { x: 0, y: 0 })).toBeNull();
  });
});
