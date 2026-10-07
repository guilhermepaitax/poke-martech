import type {
  EnergyType,
  Rarity,
  Stage,
} from "../../src/lib/value-objects/card";

const OFFICIAL_LOCAL_ID_MAX = 226;
const EXPECTED_OFFICIAL_POKEMON = 215;

const POKEMON_TYPE_TO_ENERGY = {
  Grass: "careca",
  Fire: "devops",
  Water: "ux-ui",
  Lightning: "full-stack",
  Psychic: "frontend",
  Fighting: "qa",
  Darkness: "backend",
  Metal: "testes-automatizados",
  Dragon: "admin-generico",
  Colorless: "ia",
} as const satisfies Record<string, EnergyType>;

const ENERGY_LABELS: Record<EnergyType, string> = {
  careca: "Careca",
  devops: "DevOps",
  "ux-ui": "UX/UI",
  "full-stack": "Full Stack",
  frontend: "Frontend",
  qa: "QA",
  backend: "Backend",
  "testes-automatizados": "Testes Automatizados",
  "admin-generico": "Admin Genérico",
  ia: "IA",
};

const ORIGIN_TYPE_LABELS: Record<keyof typeof POKEMON_TYPE_TO_ENERGY, string> =
  {
    Grass: "Planta",
    Fire: "Fogo",
    Water: "Água",
    Lightning: "Raio",
    Psychic: "Psíquico",
    Fighting: "Luta",
    Darkness: "Escuridão",
    Metal: "Metal",
    Dragon: "Dragão",
    Colorless: "Incolor",
  };

const RARITY_FROM_DIAMOND = {
  "One Diamond": "common",
  "Two Diamond": "uncommon",
  "Three Diamond": "rare",
  "Four Diamond": "double_rare",
} as const satisfies Record<string, Rarity>;

type ApexAttack = {
  name: string;
  cost: string[];
  damage: string | null;
  effect: string | null;
};

type ApexBooster = {
  id: string;
  name: string;
};

type ApexCard = {
  id: string;
  localId: string;
  name: string;
  hp: number;
  types: string[];
  stage: string;
  evolveFrom: string | null;
  description: string | null;
  attacks: ApexAttack[];
  abilities: { name: string; effect: string }[];
  weaknesses: { type: string }[];
  retreat: number;
  rarity: string;
  imageUrl: string | null;
  boosters: ApexBooster[];
};

type EnergyCost = {
  type: EnergyType;
  count: number;
};

function mapPokemonType(type: string): EnergyType {
  const mapped =
    POKEMON_TYPE_TO_ENERGY[type as keyof typeof POKEMON_TYPE_TO_ENERGY];
  if (!mapped) throw new Error(`Tipo de Pokémon sem correspondência: ${type}`);
  return mapped;
}

function originTypeLabel(type: string) {
  return ORIGIN_TYPE_LABELS[type as keyof typeof ORIGIN_TYPE_LABELS] ?? type;
}

function mapRarity(rarity: string): Rarity {
  const mapped =
    RARITY_FROM_DIAMOND[rarity as keyof typeof RARITY_FROM_DIAMOND];
  if (!mapped) throw new Error(`Raridade sem correspondência: ${rarity}`);
  return mapped;
}

function mapEnergyCost(cost: string[]): EnergyCost[] {
  const grouped: EnergyCost[] = [];
  for (const type of cost) {
    const mapped = mapPokemonType(type);
    const last = grouped.at(-1);
    if (last?.type === mapped && last.count < 5) last.count += 1;
    else grouped.push({ type: mapped, count: 1 });
  }
  return grouped;
}

function playStage(sourceStage: string, hasPrevo: boolean): Stage {
  if (!hasPrevo) return "basic";
  if (sourceStage === "Stage1") return "stage1";
  if (sourceStage === "Stage2") return "stage2";
  return "basic";
}

export {
  ENERGY_LABELS,
  EXPECTED_OFFICIAL_POKEMON,
  mapEnergyCost,
  mapPokemonType,
  mapRarity,
  OFFICIAL_LOCAL_ID_MAX,
  originTypeLabel,
  playStage,
};
export type { ApexAttack, ApexBooster, ApexCard, EnergyCost };
