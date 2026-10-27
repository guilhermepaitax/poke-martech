import { describe, expect, it } from "vitest";

import {
  addSpecial,
  applyPoison,
  driveTornado,
  FIRE_TORNADO_LEASH,
  POISON_MS,
  POISON_TICK_MS,
  poisonTick,
  poisonTickDamage,
  blinkPoints,
  insideZone,
  pointInRange,
  QUAKE_MS,
  QUAKE_RADIUS,
  quakeRadius,
  quakeRingHit,
  SPECIAL_MAX,
  specialGain,
  specialRatio,
  specialReady,
  splitDamage,
  surfWaveHit,
  surfWidth,
  SURF_RANGE,
  SURF_WIDTH_END,
  SURF_WIDTH_START,
  TOXIC_RADIUS_END,
  TOXIC_RADIUS_START,
  TOXIC_RANGE,
  TOXIC_TRAVEL_MS,
  toxicFront,
  toxicSweepHit,
} from "./special";

describe("medidor especial", () => {
  it("enche mais ao apanhar do que ao acertar o mesmo golpe", () => {
    expect(specialGain("taken", 10, 70)).toBeGreaterThan(specialGain("dealt", 10, 70));
  });

  it("cresce com o dano e tem ganho fixo em defesa e parry", () => {
    expect(specialGain("dealt", 14, 70)).toBeGreaterThan(specialGain("dealt", 7, 70));
    expect(specialGain("blocked", 99, 70)).toBe(specialGain("blocked", 0, 70));
    expect(specialGain("parried", 0, 70)).toBeGreaterThan(specialGain("blocked", 0, 70));
  });

  it("não passa do máximo e ignora ganho inválido", () => {
    expect(addSpecial(90, 30)).toBe(SPECIAL_MAX);
    expect(addSpecial(40, 0)).toBe(40);
    expect(addSpecial(40, Number.NaN)).toBe(40);
  });

  it("só fica pronto cheio", () => {
    expect(specialReady(SPECIAL_MAX - 0.1)).toBe(false);
    expect(specialReady(SPECIAL_MAX)).toBe(true);
    expect(specialRatio(50)).toBe(0.5);
    expect(specialRatio(-5)).toBe(0);
  });

  it("enche em poucos golpes sofridos e em mais golpes dados", () => {
    const hits = (event: "dealt" | "taken") => {
      let meter = 0;
      let count = 0;
      while (!specialReady(meter)) {
        meter = addSpecial(meter, specialGain(event, 10, 70));
        count += 1;
      }
      return count;
    };
    expect(hits("taken")).toBeLessThan(hits("dealt"));
    expect(hits("taken")).toBeGreaterThanOrEqual(3);
  });
});

describe("splitDamage", () => {
  it("divide sem perder o resto", () => {
    expect(splitDamage(10, 4)).toEqual([3, 3, 2, 2]);
    expect(splitDamage(8, 4).reduce((sum, part) => sum + part, 0)).toBe(8);
    expect(splitDamage(5, 0)).toEqual([]);
  });
});

describe("pointInRange", () => {
  it("limita o ponto ao alcance na mesma direção", () => {
    expect(pointInRange({ x: 0, y: 0 }, { x: 100, y: 0 }, 300)).toEqual({ x: 100, y: 0 });
    expect(pointInRange({ x: 0, y: 0 }, { x: 0, y: 500 }, 300)).toEqual({ x: 0, y: 300 });
  });
});

describe("zonas", () => {
  it("acha o alvo dentro do raio", () => {
    expect(insideZone({ x: 0, y: 0 }, 50, { x: 30, y: 40 })).toBe(true);
    expect(insideZone({ x: 0, y: 0 }, 50, { x: 31, y: 40 })).toBe(false);
  });
});

describe("terremoto", () => {
  it("cresce até o raio máximo no tempo do anel", () => {
    expect(quakeRadius(0)).toBe(0);
    expect(quakeRadius(QUAKE_MS / 2)).toBe(QUAKE_RADIUS / 2);
    expect(quakeRadius(QUAKE_MS * 3)).toBe(QUAKE_RADIUS);
  });

  it("acerta quando a borda passa pelo alvo", () => {
    expect(quakeRingHit(100, 140, 130)).toBe(true);
    expect(quakeRingHit(100, 140, 260)).toBe(false);
    // Alvo bem para dentro da borda já ficou para trás.
    expect(quakeRingHit(200, 240, 40)).toBe(false);
  });
});

describe("blinkPoints", () => {
  it("põe os pontos em volta do alvo, começando do lado de quem ataca", () => {
    const target = { x: 0, y: 0 };
    const points = blinkPoints(target, { x: -200, y: 0 }, 4, 50);
    expect(points).toHaveLength(4);
    points.forEach((point) => expect(Math.hypot(point.x, point.y)).toBeCloseTo(50));
    expect(points[0]?.x).toBeCloseTo(-50);
    expect(points[1]?.x).toBeCloseTo(50);
  });
});

describe("surfWidth", () => {
  it("abre da saída até o alcance máximo", () => {
    expect(surfWidth(0)).toBe(SURF_WIDTH_START);
    expect(surfWidth(SURF_RANGE)).toBe(SURF_WIDTH_END);
    expect(surfWidth(SURF_RANGE * 3)).toBe(SURF_WIDTH_END);
  });
});

describe("surfWaveHit", () => {
  const origin = { x: 0, y: 0 };
  const direction = { x: 1, y: 0 };

  it("pega o alvo que a frente da onda acabou de varrer", () => {
    expect(surfWaveHit(origin, direction, 180, 220, { x: 200, y: 40 }, 10)).toBe(true);
  });

  it("ignora quem está fora da largura ou ainda à frente", () => {
    expect(surfWaveHit(origin, direction, 180, 220, { x: 200, y: 140 }, 10)).toBe(false);
    expect(surfWaveHit(origin, direction, 180, 220, { x: 400, y: 0 }, 10)).toBe(false);
  });
});

describe("driveTornado", () => {
  const owner = { x: 0, y: 0 };

  it("anda na direção do input na velocidade, mesmo com vetor não unitário", () => {
    expect(driveTornado({ x: 0, y: 0 }, { x: 1, y: 0 }, 300, 100, owner)).toEqual({ x: 30, y: 0 });
    const diagonal = driveTornado({ x: 0, y: 0 }, { x: 1, y: 1 }, 300, 100, owner);
    expect(Math.hypot(diagonal.x, diagonal.y)).toBeCloseTo(30);
  });

  it("fica parado sem input ou com delta zero", () => {
    expect(driveTornado({ x: 10, y: 5 }, { x: 0, y: 0 }, 300, 100, owner)).toEqual({ x: 10, y: 5 });
    expect(driveTornado({ x: 10, y: 5 }, { x: 1, y: 0 }, 300, 0, owner)).toEqual({ x: 10, y: 5 });
  });

  it("não sai da coleira do dono", () => {
    const at = driveTornado({ x: FIRE_TORNADO_LEASH, y: 0 }, { x: 1, y: 0 }, 300, 1000, owner);
    expect(at.x).toBeCloseTo(FIRE_TORNADO_LEASH);
  });
});

describe("veneno", () => {
  it("aplica com tique depois do intervalo e para no fim", () => {
    let poison = applyPoison(null, 0, 3);
    expect(poisonTick(poison, POISON_TICK_MS - 1).tick).toBe(false);
    const step = poisonTick(poison, POISON_TICK_MS);
    expect(step.tick).toBe(true);
    poison = step.poison ?? poison;
    let ticks = 1;
    for (let now = POISON_TICK_MS; now <= POISON_MS + POISON_TICK_MS; now += POISON_TICK_MS) {
      const next = poisonTick(poison, now);
      if (next.tick) ticks += 1;
      if (!next.poison) break;
      poison = next.poison;
    }
    expect(ticks).toBe(POISON_MS / POISON_TICK_MS);
    expect(poisonTick(poison, POISON_MS + POISON_TICK_MS).poison).toBeNull();
  });

  it("reencostar renova a duração sem reiniciar o tique", () => {
    const first = applyPoison(null, 0, 3);
    const renewed = applyPoison(first, 1000, 2);
    expect(renewed.until).toBe(1000 + POISON_MS);
    expect(renewed.nextTickAt).toBe(first.nextTickAt);
    expect(renewed.damage).toBe(3);
  });

  it("tique mínimo de 1", () => {
    expect(poisonTickDamage(0)).toBe(1);
    expect(poisonTickDamage(24)).toBeGreaterThan(1);
  });
});

describe("névoa de veneno", () => {
  it("a frente anda e cresce até o fim da viagem", () => {
    expect(toxicFront(0)).toEqual({ travelled: 0, radius: TOXIC_RADIUS_START, done: false });
    const half = toxicFront(TOXIC_TRAVEL_MS / 2);
    expect(half.travelled).toBe(TOXIC_RANGE / 2);
    expect(half.radius).toBe((TOXIC_RADIUS_START + TOXIC_RADIUS_END) / 2);
    expect(toxicFront(TOXIC_TRAVEL_MS * 2)).toEqual({ travelled: TOXIC_RANGE, radius: TOXIC_RADIUS_END, done: true });
  });

  it("a rajada pega quem o círculo varreu", () => {
    const origin = { x: 0, y: 0 };
    const direction = { x: 1, y: 0 };
    expect(toxicSweepHit(origin, direction, 100, 140, 40, { x: 120, y: 30 })).toBe(true);
    expect(toxicSweepHit(origin, direction, 100, 140, 40, { x: 120, y: 60 })).toBe(false);
    expect(toxicSweepHit(origin, direction, 100, 140, 40, { x: 260, y: 0 })).toBe(false);
  });
});
