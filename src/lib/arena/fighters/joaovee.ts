import { EIGHT_WAY_ROWS, type ArenaFighter } from "@/lib/arena/fighter";

const SHEETS = "/arena/characters/joaovee";

const joaovee: ArenaFighter = {
  id: "joaovee",
  name: "Joãovee",
  title: "O adaptável do squad",
  description:
    "Cachinhos, cavanhaque e pelagem de raposa. O mais rápido do roster: chega num piscar e manda estrelas que curvam.",
  banner: { path: "/arena/banners/joaovee.webp", focus: "41% 45%" },
  energy: "colorless",
  ranged: "star",
  special: "last-resort",
  hp: 65,
  attacks: {
    melee: {
      name: "Ataque Rápido",
      hudName: "RÁPIDO",
      description: "Investida relâmpago, mais longa e veloz que a de qualquer outro lutador.",
      power: 28,
    },
    fire: {
      name: "Meteoro",
      hudName: "METEORO",
      description:
        "Duas estrelas que curvam atrás do alvo. Segure: três estrelas maiores no nível 1, leque de cinco no nível 2.",
      power: 26,
    },
    special: {
      name: "Último Recurso",
      hudName: "RECURSO",
      description:
        "Some e reaparece quatro vezes em volta do alvo, golpeando de todos os lados. Intocável durante a sequência.",
      power: 40,
    },
  },
  sprite: {
    cellSize: 38,
    columns: 11,
    sheets: {
      idle: { path: `${SHEETS}/idle.png`, frames: 2, rows: EIGHT_WAY_ROWS, frameRate: 4 },
      walk: { path: `${SHEETS}/walk.png`, frames: 7, rows: EIGHT_WAY_ROWS },
      attack: {
        path: `${SHEETS}/attack.png`,
        frames: 11,
        rows: EIGHT_WAY_ROWS,
        frameRate: 26,
      },
      shoot: {
        path: `${SHEETS}/shoot.png`,
        frames: 8,
        rows: EIGHT_WAY_ROWS,
        frameRate: 20,
      },
      hurt: { path: `${SHEETS}/hurt.png`, frames: 2, rows: EIGHT_WAY_ROWS },
      defend: { path: `${SHEETS}/defend.png`, frames: 10, rows: EIGHT_WAY_ROWS },
    },
  },
  tuning: {
    speed: 390,
    bodyReferenceCell: 38,
    bodyWidth: 18,
    bodyHeight: 18,
    bodyOffsetY: 12,
    feetOffsetY: 28,
    mirrorTint: 0xc8c8ff,
    depth: 2,
    displaySize: 106,
    lungeScale: 1.35,
  },
};

export { joaovee };
