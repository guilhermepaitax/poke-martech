const GENERATION_STATUSES = ["pending", "running", "completed", "failed"] as const;

const GENERATION_ITEM_STATUSES = ["pending", "done", "failed"] as const;

const MAX_GENERATION_CARDS = 6;

const POKEMON_ZONE_CARD_URL =
  /^https:\/\/(?:www\.)?pokemon-zone\.com\/cards\/([a-z0-9-]+)\/(\d+)(?:\/|$)/i;

type GenerationStatus = (typeof GENERATION_STATUSES)[number];
type GenerationItemStatus = (typeof GENERATION_ITEM_STATUSES)[number];

type PokemonZoneCardRef = {
  setId: string;
  number: string;
};

function isGenerationStatus(value: string): value is GenerationStatus {
  return GENERATION_STATUSES.some((status) => status === value);
}

function isGenerationItemStatus(value: string): value is GenerationItemStatus {
  return GENERATION_ITEM_STATUSES.some((status) => status === value);
}

function parsePokemonZoneUrl(url: string): PokemonZoneCardRef | null {
  const match = POKEMON_ZONE_CARD_URL.exec(url.trim());
  if (!match) return null;
  return {
    setId: match[1].toLowerCase(),
    number: match[2].replace(/^0+(?=\d)/, "").padStart(3, "0"),
  };
}

export {
  GENERATION_ITEM_STATUSES,
  GENERATION_STATUSES,
  isGenerationItemStatus,
  isGenerationStatus,
  MAX_GENERATION_CARDS,
  parsePokemonZoneUrl,
  POKEMON_ZONE_CARD_URL,
};
export type { GenerationItemStatus, GenerationStatus, PokemonZoneCardRef };
