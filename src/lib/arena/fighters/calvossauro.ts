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
    cellSize: 256,
    columns: 8,
    sheets: {
      idle: { path: `${SHEETS}/idle.png`, frames: 8, rows: EIGHT_WAY_ROWS },
      walk: {
        path: `${SHEETS}/walk.png`,
        frames: 8,
        // A folha exportada repete a linha "west"; a sudoeste fica na linha 9.
        rows: { ...EIGHT_WAY_ROWS, "south-west": 9 },
      },
      attack: { path: `${SHEETS}/attack.png`, frames: 5, rows: EIGHT_WAY_ROWS },
      hurt: { path: `${SHEETS}/hurt.png`, frames: 7, rows: EIGHT_WAY_ROWS },
    },
  },
  tuning: {
    speed: 340,
    bodyReferenceCell: 128,
    bodyWidth: 60,
    bodyHeight: 100,
    bodyOffsetY: 20,
    feetOffsetY: 26,
    mirrorTint: 0xc8c8ff,
    depth: 2,
  },
};

export { calvossauro };
