import { EIGHT_WAY_ROWS, type ArenaFighter } from "@/lib/arena/fighter";

const SHEETS = "/arena/characters/douguitoryu";

const douguitoryu: ArenaFighter = {
  id: "douguitoryu",
  name: "Douguitoryu",
  title: "A estrela das marés",
  description:
    "Sorriso largo e cinco pontas de estrela-do-mar. Gira pela arena acertando quem estiver em volta e afoga o rival em bolhas.",
  banner: { path: "/arena/banners/douguitoryu.webp", focus: "34% 45%" },
  energy: "water",
  ranged: "bubble",
  mobility: ["swim"],
  hp: 70,
  attacks: {
    melee: {
      name: "Giro Rápido",
      hudName: "GIRO",
      description:
        "Investida girando como pião: acerta quem estiver em volta, até pelas costas.",
      power: 30,
    },
    fire: {
      name: "Jato de Bolhas",
      hudName: "BOLHAS",
      description:
        "Rajada de três bolhas que ondulam até o alvo. Segure: bolhas maiores no nível 1, leque de cinco no nível 2.",
      power: 24,
    },
  },
  sprite: {
    cellSize: 40,
    columns: 10,
    sheets: {
      idle: {
        path: `${SHEETS}/idle.png`,
        frames: 4,
        rows: EIGHT_WAY_ROWS,
        frameRate: 5,
      },
      walk: { path: `${SHEETS}/walk.png`, frames: 4, rows: EIGHT_WAY_ROWS },
      attack: {
        path: `${SHEETS}/attack.png`,
        frames: 9,
        rows: EIGHT_WAY_ROWS,
        frameRate: 24,
      },
      shoot: {
        path: `${SHEETS}/shoot.png`,
        frames: 9,
        rows: EIGHT_WAY_ROWS,
        frameRate: 20,
      },
      hurt: { path: `${SHEETS}/hurt.png`, frames: 2, rows: EIGHT_WAY_ROWS },
      defend: {
        path: `${SHEETS}/defend.png`,
        frames: 10,
        rows: EIGHT_WAY_ROWS,
      },
    },
  },
  tuning: {
    speed: 350,
    bodyReferenceCell: 40,
    bodyWidth: 18,
    bodyHeight: 18,
    bodyOffsetY: 13,
    feetOffsetY: 30,
    mirrorTint: 0xa8d8ff,
    depth: 2,
    displaySize: 100,
    lungeScale: 1.1,
    meleeSpin: true,
  },
};

export { douguitoryu };
