import type { AimSpec } from "./aim";
import type { Point } from "./combat";
import type { SpecialStyle } from "./fighter";

// Medidor do ataque especial: enche um pouco ao acertar e mais ao apanhar.
// Cheio, libera o 3º ataque, que gasta o medidor inteiro.
const SPECIAL_MAX = 100;

type SpecialEvent = "dealt" | "taken" | "blocked" | "parried";

// Ganho fixo + parte proporcional ao dano (fração do HP máximo do alvo).
const SPECIAL_GAIN: Record<SpecialEvent, { base: number; perHp: number }> = {
  dealt: { base: 9, perHp: 90 },
  taken: { base: 15, perHp: 170 },
  blocked: { base: 8, perHp: 0 },
  parried: { base: 18, perHp: 0 },
};

// Redemoinho de Fogo: furacão guiado (WASD / alvo da CPU) enquanto o dono
// fica parado canalizando. Queima em tiques quem encostar e deixa lento.
const FIRE_TORNADO_MS = 3500;
const FIRE_TORNADO_SPEED = 340;
const FIRE_TORNADO_RADIUS = 46;
const FIRE_TORNADO_TICK_MS = 250;
// O total vale se o alvo ficar colado o tempo todo; quem foge leva menos.
const FIRE_TORNADO_DAMAGE = 1.4;
// Distância máxima do furacão até o dono.
const FIRE_TORNADO_LEASH = 900;
const FIRE_TORNADO_SLOW = 0.5;
// Névoa de Veneno (como o Spray Tóxico da Emz): a rajada viaja para a frente
// crescendo e vira uma nuvem que fica um instante. Encostar envenena.
const TOXIC_RANGE = 400;
// Mira com força: clique curto joga perto, segurar joga até o alcance máximo.
const TOXIC_MIN_RANGE = 120;
const TOXIC_POWER_MS = 900;
const TOXIC_TRAVEL_MS = 400;
const TOXIC_RADIUS_START = 26;
const TOXIC_RADIUS_END = 100;
const TOXIC_LINGER_MS = 1000;
const TOXIC_TICK_MS = 250;
// Frações do dano do especial: contato na viagem e soma dos tiques da nuvem.
const TOXIC_IMPACT = 0.35;
const TOXIC_LINGER_DAMAGE = 0.3;
const POISON_MS = 3000;
const POISON_TICK_MS = 500;
// Total do veneno inteiro (todos os tiques) sobre o dano do especial.
const POISON_DAMAGE = 0.5;
// Terremoto: anel que cresce do lutador; indefensável, o dash esquiva.
const QUAKE_RADIUS = 300;
const QUAKE_MS = 600;
const QUAKE_BAND = 28;
// Último Recurso: some e reaparece em volta do alvo, golpe a golpe.
const LAST_RESORT_RANGE = 380;
const LAST_RESORT_BLINKS = 4;
const LAST_RESORT_BLINK_MS = 110;
const LAST_RESORT_GAP = 64;
// Surfar: parede de água que avança na mira e arrasta o alvo.
// A onda abre conforme avança (mesmo formato do cone da mira).
const SURF_RANGE = 640;
const SURF_MIN_RANGE = 200;
const SURF_POWER_MS = 900;
const SURF_SPEED = 560;
const SURF_WIDTH_START = 120;
const SURF_WIDTH_END = 280;
const SURF_RADIUS = 18;
// Trovão: marca o chão sob o alvo e o raio cai do céu depois do aviso.
const THUNDER_RANGE = 560;
const THUNDER_DELAY_MS = 650;
const THUNDER_RADIUS = 70;
const THUNDER_STUN_MS = 1000;

// Distância em que a CPU tenta o especial.
const SPECIAL_RANGE: Record<SpecialStyle, number> = {
  "fire-tornado": Math.round(FIRE_TORNADO_LEASH * 0.6),
  "toxic-mist": Math.round(TOXIC_RANGE * 0.85),
  quake: Math.round(QUAKE_RADIUS * 0.75),
  "last-resort": LAST_RESORT_RANGE,
  surf: Math.round(SURF_RANGE * 0.7),
  thunder: THUNDER_RANGE,
};

// Folha usada no golpe: `shoot` para o que sai da mão, `attack` para o corpo.
const SPECIAL_CLIP: Record<SpecialStyle, "attack" | "shoot"> = {
  "fire-tornado": "attack",
  "toxic-mist": "shoot",
  quake: "attack",
  "last-resort": "attack",
  surf: "attack",
  thunder: "shoot",
};

// Veneno ativo: até quando dura, próximo tique e dano de cada tique.
type PoisonState = {
  until: number;
  nextTickAt: number;
  damage: number;
};

type PoisonStep = {
  poison: PoisonState | null;
  tick: boolean;
};

// Especiais com mira própria (formato em `aim.ts`); os outros usam a seta.
const SPECIAL_AIM: Partial<Record<SpecialStyle, AimSpec>> = {
  surf: {
    kind: "cone",
    range: SURF_RANGE,
    minRange: SURF_MIN_RANGE,
    nearWidth: SURF_WIDTH_START,
    farWidth: SURF_WIDTH_END,
    powerMs: SURF_POWER_MS,
  },
  "toxic-mist": {
    kind: "cone",
    range: TOXIC_RANGE,
    minRange: TOXIC_MIN_RANGE,
    nearWidth: TOXIC_RADIUS_START * 2,
    farWidth: TOXIC_RADIUS_END * 2,
    powerMs: TOXIC_POWER_MS,
  },
};

function specialGain(event: SpecialEvent, dealt: number, targetMaxHp: number) {
  const gain = SPECIAL_GAIN[event];
  const ratio = targetMaxHp > 0 ? Math.max(0, dealt) / targetMaxHp : 0;
  return gain.base + ratio * gain.perHp;
}

function addSpecial(meter: number, gain: number) {
  if (!(gain > 0)) return meter;
  return Math.min(SPECIAL_MAX, meter + gain);
}

function specialReady(meter: number) {
  return meter >= SPECIAL_MAX;
}

function specialRatio(meter: number) {
  return Math.min(Math.max(meter / SPECIAL_MAX, 0), 1);
}

// Divide `total` em `parts` inteiros sem perder o resto (os primeiros levam +1).
function splitDamage(total: number, parts: number): number[] {
  if (parts <= 0) return [];
  const amount = Math.max(0, Math.round(total));
  const base = Math.floor(amount / parts);
  const rest = amount - base * parts;
  return Array.from({ length: parts }, (_, index) => base + (index < rest ? 1 : 0));
}

// Ponto na direção de `toward`, a no máximo `range` de `from`.
function pointInRange(from: Point, toward: Point, range: number): Point {
  const dx = toward.x - from.x;
  const dy = toward.y - from.y;
  const distance = Math.hypot(dx, dy);
  if (distance <= range || distance === 0) return { x: toward.x, y: toward.y };
  return { x: from.x + (dx / distance) * range, y: from.y + (dy / distance) * range };
}

function insideZone(center: Point, radius: number, point: Point) {
  return Math.hypot(point.x - center.x, point.y - center.y) <= radius;
}

// Raio do anel do Terremoto depois de `elapsedMs`.
function quakeRadius(elapsedMs: number) {
  if (elapsedMs <= 0) return 0;
  return QUAKE_RADIUS * Math.min(1, elapsedMs / QUAKE_MS);
}

// A borda do anel passou pelo alvo entre um quadro e outro.
function quakeRingHit(previous: number, next: number, distance: number, band = QUAKE_BAND) {
  return distance <= next + band && distance > previous - band;
}

// Pontos em volta do alvo: o primeiro do lado de quem ataca, depois o oposto
// e os dois flancos (golpes vindo de todos os lados).
function blinkPoints(target: Point, from: Point, count = LAST_RESORT_BLINKS, gap = LAST_RESORT_GAP) {
  const dx = from.x - target.x;
  const dy = from.y - target.y;
  const start = dx === 0 && dy === 0 ? Math.PI : Math.atan2(dy, dx);
  const turns = [0, Math.PI, Math.PI / 2, -Math.PI / 2];
  return Array.from({ length: count }, (_, index) => {
    const angle = start + (turns[index % turns.length] ?? 0) + Math.floor(index / turns.length) * (Math.PI / 4);
    return { x: target.x + Math.cos(angle) * gap, y: target.y + Math.sin(angle) * gap };
  });
}

// Largura da onda depois de andar `travelled` px.
function surfWidth(travelled: number) {
  const t = Math.min(1, Math.max(0, travelled / SURF_RANGE));
  return SURF_WIDTH_START + (SURF_WIDTH_END - SURF_WIDTH_START) * t;
}

// A frente da onda varreu o alvo entre `previous` e `travelled` px.
function surfWaveHit(
  origin: Point,
  direction: Point,
  previous: number,
  travelled: number,
  target: Point,
  reach: number,
  width = surfWidth(travelled),
) {
  const length = Math.hypot(direction.x, direction.y);
  if (length === 0) return false;
  const ux = direction.x / length;
  const uy = direction.y / length;
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const along = dx * ux + dy * uy;
  const side = Math.abs(dx * uy - dy * ux);
  return along >= previous - reach && along <= travelled + reach && side <= width / 2 + reach;
}

// Anda na direção de `move` (WASD, sem precisar ser unitário) e não sai da
// coleira em volta do dono. Sem input, fica parado.
function driveTornado(
  position: Point,
  move: Point,
  speed: number,
  deltaMs: number,
  owner: Point,
  leash = FIRE_TORNADO_LEASH,
): Point {
  const length = Math.hypot(move.x, move.y);
  if (length === 0) return pointInRange(owner, position, leash);
  const step = (Math.max(0, speed) * Math.max(0, deltaMs)) / 1000;
  const moved = {
    x: position.x + (move.x / length) * step,
    y: position.y + (move.y / length) * step,
  };
  return pointInRange(owner, moved, leash);
}

// Frente da rajada após `elapsedMs`: quanto andou e o raio (cresce no caminho).
function toxicFront(elapsedMs: number, range = TOXIC_RANGE) {
  const t = Math.min(1, Math.max(0, elapsedMs) / TOXIC_TRAVEL_MS);
  return {
    travelled: range * t,
    radius: TOXIC_RADIUS_START + (TOXIC_RADIUS_END - TOXIC_RADIUS_START) * t,
    done: t >= 1,
  };
}

// O círculo da rajada, indo de `previous` a `travelled` px, encostou no alvo.
function toxicSweepHit(
  origin: Point,
  direction: Point,
  previous: number,
  travelled: number,
  radius: number,
  target: Point,
) {
  const length = Math.hypot(direction.x, direction.y);
  if (length === 0) return false;
  const ux = direction.x / length;
  const uy = direction.y / length;
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const along = Math.min(travelled, Math.max(previous, dx * ux + dy * uy));
  return Math.hypot(dx - ux * along, dy - uy * along) <= radius;
}

function poisonTickDamage(total: number) {
  return Math.max(1, Math.round((total * POISON_DAMAGE) / (POISON_MS / POISON_TICK_MS)));
}

// Encostar na nuvem envenena; já envenenado, só renova a duração (não empilha).
function applyPoison(poison: PoisonState | null, now: number, damage: number): PoisonState {
  if (!poison) return { until: now + POISON_MS, nextTickAt: now + POISON_TICK_MS, damage };
  return { ...poison, until: now + POISON_MS, damage: Math.max(poison.damage, damage) };
}

function poisonTick(poison: PoisonState | null, now: number): PoisonStep {
  if (!poison) return { poison: null, tick: false };
  if (now >= poison.nextTickAt && poison.nextTickAt <= poison.until) {
    return { poison: { ...poison, nextTickAt: poison.nextTickAt + POISON_TICK_MS }, tick: true };
  }
  if (now >= poison.until) return { poison: null, tick: false };
  return { poison, tick: false };
}

export {
  addSpecial,
  applyPoison,
  driveTornado,
  blinkPoints,
  FIRE_TORNADO_DAMAGE,
  FIRE_TORNADO_LEASH,
  FIRE_TORNADO_MS,
  FIRE_TORNADO_RADIUS,
  FIRE_TORNADO_SLOW,
  FIRE_TORNADO_SPEED,
  FIRE_TORNADO_TICK_MS,
  insideZone,
  LAST_RESORT_BLINK_MS,
  LAST_RESORT_BLINKS,
  LAST_RESORT_GAP,
  LAST_RESORT_RANGE,
  pointInRange,
  POISON_MS,
  POISON_TICK_MS,
  poisonTick,
  poisonTickDamage,
  QUAKE_BAND,
  QUAKE_MS,
  QUAKE_RADIUS,
  quakeRadius,
  quakeRingHit,
  SPECIAL_AIM,
  SPECIAL_CLIP,
  SPECIAL_GAIN,
  SPECIAL_MAX,
  SPECIAL_RANGE,
  specialGain,
  specialRatio,
  specialReady,
  splitDamage,
  SURF_RADIUS,
  SURF_RANGE,
  SURF_MIN_RANGE,
  SURF_POWER_MS,
  SURF_SPEED,
  SURF_WIDTH_END,
  SURF_WIDTH_START,
  surfWidth,
  surfWaveHit,
  THUNDER_DELAY_MS,
  THUNDER_RADIUS,
  THUNDER_RANGE,
  THUNDER_STUN_MS,
  TOXIC_IMPACT,
  TOXIC_LINGER_DAMAGE,
  TOXIC_LINGER_MS,
  TOXIC_MIN_RANGE,
  TOXIC_POWER_MS,
  TOXIC_RADIUS_END,
  TOXIC_RADIUS_START,
  TOXIC_RANGE,
  TOXIC_TICK_MS,
  TOXIC_TRAVEL_MS,
  toxicFront,
  toxicSweepHit,
};
export type { PoisonState, PoisonStep, SpecialEvent };
