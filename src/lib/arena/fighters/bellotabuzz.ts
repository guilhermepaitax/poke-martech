import { EIGHT_WAY_ROWS, type ArenaFighter } from "@/lib/arena/fighter";

const SHEETS = "/arena/characters/bellotabuzz";

const bellotabuzz: ArenaFighter = {
  id: "bellotabuzz",
  name: "Bellotabuzz",
  title: "O dínamo do sprint",
  description:
    "Barba fechada, listras de tigre e duas antenas sempre em curto. Chega no soco elétrico e derruba o rival com raios em zigue-zague.",
  banner: { path: "/arena/banners/bellotabuzz.webp", focus: "31% 35%" },
  energy: "lightning",
  ranged: "bolt",
  special: "thunder",
  hp: 70,
  attacks: {
    melee: {
      name: "Soco Trovão",
      hudName: "TROVÃO",
      description: "Soco carregado de eletricidade: o acerto solta faíscas em volta do alvo.",
      power: 34,
    },
    fire: {
      name: "Choque do Trovão",
      hudName: "RAIO",
      description:
        "Estala nas mãos e solta um raio em zigue-zague que cai na hora. Segure: raio mais grosso no nível 1, três raios em leque no nível 2.",
      power: 28,
    },
    special: {
      name: "Trovão",
      hudName: "TROVÃO",
      description:
        "Marca o chão sob o alvo e um raio cai do céu logo depois, paralisando quem ficar na marca.",
      power: 42,
    },
  },
  sprite: {
    cellSize: 56,
    columns: 13,
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
        frames: 13,
        rows: EIGHT_WAY_ROWS,
        frameRate: 28,
      },
      shoot: {
        path: `${SHEETS}/shoot.png`,
        frames: 11,
        rows: EIGHT_WAY_ROWS,
        frameRate: 22,
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
    speed: 365,
    bodyReferenceCell: 56,
    bodyWidth: 20,
    bodyHeight: 20,
    bodyOffsetY: 19,
    feetOffsetY: 28,
    mirrorTint: 0xffd8a0,
    depth: 2,
    displaySize: 140,
    meleeShock: true,
  },
};

export { bellotabuzz };
