import { EIGHT_WAY_ROWS, type ArenaFighter } from "@/lib/arena/fighter";

const SHEETS = "/arena/characters/papaitaxone";

const papaitaxone: ArenaFighter = {
  id: "papaitaxone",
  name: "Papaitaxone",
  title: "O guardião do osso",
  description:
    "Pequeno, sério e sempre de capacete de crânio. Desce a clava de perto e arremessa o osso, que vai e volta para a mão.",
  banner: { path: "/arena/banners/papaitaxone.webp", focus: "35% 25%" },
  energy: "ground",
  ranged: "bone",
  hp: 75,
  attacks: {
    melee: {
      name: "Clava de Osso",
      hudName: "CLAVA",
      description: "Golpe de osso em arco que acerta quem estiver à frente.",
      power: 35,
    },
    fire: {
      name: "Ossomerang",
      hudName: "OSSO",
      description:
        "Osso giratório que vai até o alcance máximo e volta, acertando na ida e na volta. Segure: osso maior no nível 1, dois ossos no nível 2.",
      power: 22,
    },
  },
  sprite: {
    cellSize: 40,
    columns: 10,
    sheets: {
      idle: { path: `${SHEETS}/idle.png`, frames: 6, rows: EIGHT_WAY_ROWS },
      walk: { path: `${SHEETS}/walk.png`, frames: 4, rows: EIGHT_WAY_ROWS },
      attack: {
        path: `${SHEETS}/attack.png`,
        frames: 10,
        rows: EIGHT_WAY_ROWS,
        frameRate: 24,
      },
      shoot: {
        path: `${SHEETS}/shoot.png`,
        frames: 10,
        rows: EIGHT_WAY_ROWS,
        frameRate: 24,
      },
      hurt: { path: `${SHEETS}/hurt.png`, frames: 2, rows: EIGHT_WAY_ROWS },
    },
  },
  tuning: {
    speed: 360,
    bodyReferenceCell: 40,
    bodyWidth: 18,
    bodyHeight: 20,
    bodyOffsetY: 12,
    feetOffsetY: 34,
    mirrorTint: 0xc8c8ff,
    depth: 2,
    displaySize: 112,
  },
};

export { papaitaxone };
