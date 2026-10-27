import { EIGHT_WAY_ROWS, type ArenaFighter } from "@/lib/arena/fighter";

const SHEETS = "/arena/characters/antoniomander";

const antoniomander: ArenaFighter = {
  id: "antoniomander",
  name: "Antoniomander",
  title: "O incendiário do deploy",
  description:
    "Pequeno, teimoso e sempre com a cauda acesa. Avança de cabeça e responde à distância com uma rajada de fogo.",
  banner: { path: "/arena/banners/antoniomander.webp", focus: "51% 40%" },
  energy: "fire",
  ranged: "beam",
  special: "fire-tornado",
  hp: 70,
  attacks: {
    melee: {
      name: "Cabeçada",
      hudName: "CABEÇADA",
      description: "Investida curta que acerta quem estiver à frente.",
      power: 30,
    },
    fire: {
      name: "Lança-chamas",
      hudName: "CHAMAS",
      description: "Raio de fogo em linha reta. Segure para carregar.",
      power: 30,
    },
    special: {
      name: "Redemoinho de Fogo",
      hudName: "FOGO",
      description:
        "Lança um furacão de fogo guiado pelo WASD por 3 segundos, deixando um rastro de chamas. Enquanto guia, fica parado e vulnerável: um golpe desfaz o furacão.",
      power: 40,
    },
  },
  sprite: {
    cellSize: 36,
    columns: 11,
    sheets: {
      idle: { path: `${SHEETS}/idle.png`, frames: 4, rows: EIGHT_WAY_ROWS, frameRate: 5 },
      walk: { path: `${SHEETS}/walk.png`, frames: 4, rows: EIGHT_WAY_ROWS },
      attack: {
        path: `${SHEETS}/attack.png`,
        frames: 11,
        rows: EIGHT_WAY_ROWS,
        frameRate: 24,
      },
      shoot: {
        path: `${SHEETS}/shoot.png`,
        frames: 10,
        rows: EIGHT_WAY_ROWS,
        frameRate: 20,
      },
      hurt: { path: `${SHEETS}/hurt.png`, frames: 2, rows: EIGHT_WAY_ROWS },
      defend: { path: `${SHEETS}/defend.png`, frames: 10, rows: EIGHT_WAY_ROWS },
    },
  },
  tuning: {
    speed: 340,
    bodyReferenceCell: 36,
    bodyWidth: 16,
    bodyHeight: 16,
    bodyOffsetY: 14,
    feetOffsetY: 36,
    mirrorTint: 0xc8c8ff,
    depth: 2,
    displaySize: 110,
  },
};

export { antoniomander };
