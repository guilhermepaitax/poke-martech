import { COLORLESS } from "@/lib/battle/energy-cost";
import type { EnergyType, Stage } from "@/lib/value-objects/card";

const DECK_SIZE = 20;
const MAX_COPIES = 2;
const MAX_ENERGY_TYPES = 3;

type DeckRuleEntry = {
  cardId: string;
  name: string;
  stage: Stage;
  energyType: EnergyType;
  copies: number;
  owned: number | null;
};

function deckSize(entries: Pick<DeckRuleEntry, "copies">[]): number {
  return entries.reduce((sum, entry) => sum + entry.copies, 0);
}

function deriveEnergyTypes(entries: Pick<DeckRuleEntry, "energyType" | "copies">[]): EnergyType[] {
  const types = [...new Set(entries.filter((entry) => entry.copies > 0).map((entry) => entry.energyType))];
  const colored = types.filter((type) => type !== COLORLESS);
  if (colored.length > 0) return colored;
  return types.length > 0 ? [COLORLESS] : [];
}

function resolveEnergyTypes(
  entries: Pick<DeckRuleEntry, "energyType" | "copies">[],
  chosen: EnergyType[],
): EnergyType[] {
  const available = deriveEnergyTypes(entries);
  const picked = chosen.filter((type) => available.includes(type));
  if (picked.length > 0) return picked.slice(0, MAX_ENERGY_TYPES);
  return available.slice(0, MAX_ENERGY_TYPES);
}

function validateDeck(entries: DeckRuleEntry[], energyTypes: EnergyType[]): string[] {
  const errors: string[] = [];
  const size = deckSize(entries);
  if (size !== DECK_SIZE) errors.push(`O deck precisa ter exatamente ${DECK_SIZE} cartas (atual: ${size}).`);
  for (const entry of entries) {
    if (entry.copies > MAX_COPIES) errors.push(`${entry.name}: no máximo ${MAX_COPIES} cópias.`);
    if (entry.owned !== null && entry.copies > entry.owned) {
      errors.push(`${entry.name}: você só possui ${entry.owned} cópia${entry.owned === 1 ? "" : "s"}.`);
    }
  }
  if (!entries.some((entry) => entry.copies > 0 && entry.stage === "basic")) {
    errors.push("O deck precisa de pelo menos 1 Pokémon Básico.");
  }
  const available = deriveEnergyTypes(entries);
  if (energyTypes.length === 0) errors.push("Escolha pelo menos 1 tipo de energia.");
  if (energyTypes.length > MAX_ENERGY_TYPES) errors.push(`Escolha no máximo ${MAX_ENERGY_TYPES} tipos de energia.`);
  if (energyTypes.some((type) => !available.includes(type))) {
    errors.push("Os tipos de energia precisam vir das cartas do deck.");
  }
  return errors;
}

export {
  DECK_SIZE,
  deckSize,
  deriveEnergyTypes,
  MAX_COPIES,
  MAX_ENERGY_TYPES,
  resolveEnergyTypes,
  validateDeck,
};
export type { DeckRuleEntry };
