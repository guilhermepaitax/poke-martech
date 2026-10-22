import {
  CARDINAL_ROWS,
  EIGHT_WAY_ROWS,
  type ArenaFighter,
} from "@/lib/arena/fighter";

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
  },
  sprite: {
    cellSize: 128,
    columns: 8,
    sheets: {
      idle: { path: `${SHEETS}/idle.png`, frames: 8, rows: EIGHT_WAY_ROWS },
      walk: { path: `${SHEETS}/walk.png`, frames: 8, rows: EIGHT_WAY_ROWS },
      attack: { path: `${SHEETS}/attack.png`, frames: 3, rows: CARDINAL_ROWS },
      hurt: { path: `${SHEETS}/hurt.png`, frames: 6, rows: CARDINAL_ROWS },
    },
  },
  tuning: {
    speed: 340,
    bodyReferenceCell: 128,
    bodyWidth: 60,
    bodyHeight: 100,
    bodyOffsetY: 20,
    feetOffsetY: 36,
    mirrorTint: 0xc8c8ff,
    depth: 2,
  },
};

export { antoniomander };
