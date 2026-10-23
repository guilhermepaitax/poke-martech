import { EIGHT_WAY_ROWS, type ArenaFighter } from "@/lib/arena/fighter";

const SHEETS = "/arena/characters/calvossauro";

const calvossauro: ArenaFighter = {
  id: "calvossauro",
  name: "Calvossauro",
  title: "O botânico de óculos",
  description:
    "Simpático, robusto e difícil de derrubar. Carrega um bulbo de folhas nas costas e duas vinhas que nunca param quietas.",
  banner: { path: "/arena/banners/calvossauro.webp", focus: "40% 70%" },
  energy: "grass",
  ranged: "orb",
  hp: 80,
  attacks: {
    melee: {
      name: "Cabeçada",
      hudName: "CABEÇADA",
      description: "Cabeçada pesada que empurra o bulbo inteiro para frente.",
      power: 40,
    },
    fire: {
      name: "Bola de energia",
      hudName: "ENERGIA",
      description:
        "Bola de energia verde que viaja até o alvo. Segure: maior no nível 1, três bolas no nível 2.",
      power: 25,
    },
  },
  sprite: {
    cellSize: 34,
    columns: 11,
    sheets: {
      idle: { path: `${SHEETS}/idle.png`, frames: 3, rows: EIGHT_WAY_ROWS, frameRate: 5 },
      walk: { path: `${SHEETS}/walk.png`, frames: 6, rows: EIGHT_WAY_ROWS },
      attack: {
        path: `${SHEETS}/attack.png`,
        frames: 11,
        rows: EIGHT_WAY_ROWS,
        frameRate: 24,
      },
      shoot: {
        path: `${SHEETS}/shoot.png`,
        frames: 6,
        rows: EIGHT_WAY_ROWS,
        frameRate: 16,
      },
      hurt: { path: `${SHEETS}/hurt.png`, frames: 2, rows: EIGHT_WAY_ROWS },
      defend: { path: `${SHEETS}/defend.png`, frames: 10, rows: EIGHT_WAY_ROWS },
    },
  },
  tuning: {
    speed: 340,
    bodyReferenceCell: 34,
    bodyWidth: 16,
    bodyHeight: 16,
    bodyOffsetY: 14,
    feetOffsetY: 36,
    mirrorTint: 0xc8c8ff,
    depth: 2,
    displaySize: 110,
  },
};

export { calvossauro };
