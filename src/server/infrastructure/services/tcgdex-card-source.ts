import sharp from "sharp";
import { parsePokemonZoneUrl, type PokemonZoneCardRef } from "@/lib/value-objects/card-generation";
import type {
  PokemonArtwork,
  PokemonCardSource,
} from "@/server/application/contracts/services/pokemon-card-source";
import type { SourcePokemon } from "@/server/application/entities/source-pokemon";
import { downloadImage } from "@/server/infrastructure/services/remote-image";

const TCGDEX_API = "https://api.tcgdex.net/v2/en";
const REQUEST_TIMEOUT_MS = 15_000;
const FRAMED_RARITIES = new Set(["One Diamond", "Two Diamond", "Three Diamond"]);

const ARTWORK_BOXES = {
  framed: { left: 0.087, top: 0.117, width: 0.826, height: 0.353 },
  fullArt: { left: 0.04, top: 0.117, width: 0.92, height: 0.46 },
};

type TcgdexCard = {
  id: string;
  name: string;
  image?: string;
  hp?: number;
  types?: string[];
  stage?: string;
  description?: string;
  attacks?: { name: string; cost?: string[]; damage?: string | number; effect?: string }[];
  abilities?: { name: string; effect: string }[];
  weaknesses?: { type: string; value?: string }[];
  retreat?: number;
  rarity?: string;
};

type TcgdexSerie = {
  sets: { id: string }[];
};

let setIdsPromise: Promise<string[]> | null = null;

class TcgdexCardSource implements PokemonCardSource {
  async fetchByUrl(url: string): Promise<SourcePokemon | null> {
    const ref = parsePokemonZoneUrl(url);
    if (!ref) return null;
    const cardId = resolveTcgdexCardId(ref, await loadPocketSetIds());
    if (!cardId) return null;
    const res = await fetch(`${TCGDEX_API}/cards/${encodeURIComponent(cardId)}`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`TCGdex respondeu HTTP ${res.status}.`);
    return toSourcePokemon((await res.json()) as TcgdexCard);
  }

  async fetchArtwork(pokemon: SourcePokemon): Promise<PokemonArtwork | null> {
    if (!pokemon.imageUrl) return null;
    const card = await downloadImage(pokemon.imageUrl);
    const image = sharp(card.bytes);
    const { width, height } = await image.metadata();
    if (!width || !height) return null;
    const bytes = await image
      .extract(artworkBox(pokemon.rarity, width, height))
      .webp({ quality: 92 })
      .toBuffer();
    return { bytes: new Uint8Array(bytes), contentType: "image/webp" };
  }
}

function artworkBox(rarity: string | null, width: number, height: number) {
  const box = !rarity || FRAMED_RARITIES.has(rarity) ? ARTWORK_BOXES.framed : ARTWORK_BOXES.fullArt;
  return {
    left: Math.round(box.left * width),
    top: Math.round(box.top * height),
    width: Math.round(box.width * width),
    height: Math.round(box.height * height),
  };
}

async function loadPocketSetIds() {
  setIdsPromise ??= fetch(`${TCGDEX_API}/series/tcgp`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
    .then(async (res) => {
      if (!res.ok) throw new Error(`TCGdex respondeu HTTP ${res.status}.`);
      const serie = (await res.json()) as TcgdexSerie;
      return serie.sets.map((set) => set.id);
    })
    .catch((error: unknown) => {
      setIdsPromise = null;
      throw error;
    });
  return setIdsPromise;
}

function resolveTcgdexCardId(ref: PokemonZoneCardRef, setIds: string[]) {
  const setId = setIds.find((id) => id.toLowerCase() === ref.setId);
  if (!setId) return null;
  return `${setId}-${ref.number}`;
}

function toSourcePokemon(card: TcgdexCard): SourcePokemon {
  return {
    externalId: card.id,
    name: card.name,
    hp: card.hp ?? null,
    types: card.types ?? [],
    stage: card.stage ?? null,
    description: card.description ?? null,
    attacks: (card.attacks ?? []).map((attack) => ({
      name: attack.name,
      cost: attack.cost ?? [],
      damage: attack.damage === undefined ? null : String(attack.damage),
      effect: attack.effect ?? null,
    })),
    abilities: (card.abilities ?? []).map((ability) => ({ name: ability.name, effect: ability.effect })),
    weaknesses: (card.weaknesses ?? []).map((weakness) => ({
      type: weakness.type,
      value: weakness.value ?? null,
    })),
    retreat: card.retreat ?? null,
    rarity: card.rarity ?? null,
    imageUrl: card.image ? `${card.image}/high.png` : null,
  };
}

export { artworkBox, resolveTcgdexCardId, TcgdexCardSource };
