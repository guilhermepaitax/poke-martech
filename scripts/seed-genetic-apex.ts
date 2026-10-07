import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fuseCatalog } from "./genetic-apex/fuse";
import { renderFusionsMarkdown } from "./genetic-apex/markdown";
import {
  ENERGY_LABELS,
  EXPECTED_OFFICIAL_POKEMON,
  OFFICIAL_LOCAL_ID_MAX,
  type ApexCard,
} from "./genetic-apex/types";

config({ path: ".env" });

const TCGDEX_API = "https://api.tcgdex.net/v2/en";
const MARKDOWN_PATH = path.resolve(
  process.cwd(),
  "docs/genetic-apex-fusoes.md",
);

function sourceKey(localId: string) {
  return `a1-${localId.padStart(3, "0")}`;
}

function sourceKeyFromSlug(slug: string) {
  const key = slug.match(/^(a1-\d{3})-/)?.[1];
  if (!key) throw new Error(`Slug fora do Genetic Apex: ${slug}`);
  return key;
}

type TcgdexListCard = {
  id: string;
  localId: string;
};

type TcgdexCard = {
  category?: string;
  id: string;
  localId: string;
  name: string;
  hp?: number;
  types?: string[];
  stage?: string;
  evolveFrom?: string;
  description?: string;
  attacks?: {
    name: string;
    cost?: string[];
    damage?: string | number;
    effect?: string;
  }[];
  abilities?: { name: string; effect: string }[];
  weaknesses?: { type: string }[];
  retreat?: number;
  rarity?: string;
  image?: string;
  boosters?: { id: string; name: string }[];
};

async function fetchJson<T>(url: string): Promise<T> {
  let last: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok)
        throw new Error(`TCGdex HTTP ${response.status} em ${url}`);
      return (await response.json()) as T;
    } catch (error) {
      last = error;
    }
  }
  throw last;
}

async function mapPool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
) {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next;
      next += 1;
      const item = items[index];
      if (item === undefined) return;
      results[index] = await fn(item);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker()),
  );
  return results;
}

function toApexCard(card: TcgdexCard): ApexCard {
  if (!card.hp) throw new Error(`HP ausente em ${card.id}`);
  if (!card.rarity) throw new Error(`Raridade ausente em ${card.id}`);
  return {
    id: card.id,
    localId: card.localId,
    name: card.name,
    hp: card.hp,
    types: card.types ?? [],
    stage: card.stage ?? "Basic",
    evolveFrom: card.evolveFrom ?? null,
    description: card.description ?? null,
    attacks: (card.attacks ?? []).map((attack) => ({
      name: attack.name.trim(),
      cost: attack.cost ?? [],
      damage: attack.damage === undefined ? null : String(attack.damage),
      effect: attack.effect ?? null,
    })),
    abilities: (card.abilities ?? []).map((ability) => ({
      name: ability.name,
      effect: ability.effect,
    })),
    weaknesses: (card.weaknesses ?? []).map((weakness) => ({
      type: weakness.type,
    })),
    retreat: card.retreat ?? 0,
    rarity: card.rarity,
    imageUrl: card.image ? `${card.image.replace(/\/$/, "")}/high.png` : null,
    boosters: (card.boosters ?? []).map((booster) => ({
      id: booster.id,
      name: booster.name,
    })),
  };
}

async function fetchOfficialApex() {
  const set = await fetchJson<{ cards: TcgdexListCard[] }>(
    `${TCGDEX_API}/sets/A1`,
  );
  const official = set.cards.filter(
    (card) => Number(card.localId) <= OFFICIAL_LOCAL_ID_MAX,
  );
  const details = await mapPool(official, 12, (card) =>
    fetchJson<TcgdexCard>(`${TCGDEX_API}/cards/${card.id}`),
  );
  return details.filter((card) => card.category === "Pokemon").map(toApexCard);
}

async function main() {
  const source = await fetchOfficialApex();
  if (source.length !== EXPECTED_OFFICIAL_POKEMON) {
    throw new Error(
      `Esperava ${EXPECTED_OFFICIAL_POKEMON} Pokémon oficiais e vieram ${source.length}.`,
    );
  }
  const fused = fuseCatalog(source);
  await mkdir(path.dirname(MARKDOWN_PATH), { recursive: true });
  await writeFile(MARKDOWN_PATH, renderFusionsMarkdown(fused), "utf8");
  console.log(`Markdown escrito em ${MARKDOWN_PATH} (${fused.length} cartas).`);

  const { db } = await import("../src/server/infrastructure/db/drizzle/client");
  const { cards, cardAttacks, pokemonTypes } =
    await import("../src/server/infrastructure/db/drizzle/schema");

  for (const [code, name] of Object.entries(ENERGY_LABELS)) {
    await db.insert(pokemonTypes).values({ code, name }).onConflictDoNothing();
  }

  const existing = await db
    .select({ id: cards.id, slug: cards.slug })
    .from(cards);
  const idBySourceKey = new Map<string, string>();
  for (const row of existing) {
    const key = row.slug.match(/^(a1-\d{3})-/)?.[1];
    if (key && !idBySourceKey.has(key)) idBySourceKey.set(key, row.id);
  }
  for (const card of fused) {
    const key = sourceKey(card.source.localId);
    if (!idBySourceKey.has(key)) idBySourceKey.set(key, crypto.randomUUID());
  }

  const stageOrder = { basic: 0, stage1: 1, stage2: 2 };
  const ordered = [...fused].sort(
    (left, right) =>
      stageOrder[left.stage] - stageOrder[right.stage] ||
      Number(left.source.localId) - Number(right.source.localId),
  );

  let inserted = 0;
  let updated = 0;
  await db.transaction(async (tx) => {
    for (const card of ordered) {
      const key = sourceKey(card.source.localId);
      const id = idBySourceKey.get(key);
      if (!id) throw new Error(`Id ausente para ${card.slug}`);
      const evolvesFromId = card.evolvesFromSlug
        ? (idBySourceKey.get(sourceKeyFromSlug(card.evolvesFromSlug)) ?? null)
        : null;
      if (card.evolvesFromSlug && !evolvesFromId) {
        throw new Error(
          `Pré-evolução ausente para ${card.slug}: ${card.evolvesFromSlug}`,
        );
      }
      const values = {
        name: card.name,
        slug: card.slug,
        imageUrl: null,
        imageX: 50,
        imageY: 50,
        imageScale: 100,
        overlayImageUrl: null,
        overlayX: 50,
        overlayY: 50,
        overlayScale: 100,
        decorationAsset: null,
        decorationImageUrl: null,
        hp: card.hp,
        energyType: card.energyType,
        stage: card.stage,
        frame: card.frame,
        evolvesFromId,
        retreatCost: card.retreatCost,
        weaknessType: card.weaknessType,
        weaknessModifier: 20,
        rarity: card.rarity,
        flavorText: card.flavorText,
        published: false,
      };
      const alreadyThere = existing.some((row) => row.id === id);
      if (alreadyThere) {
        await tx.update(cards).set(values).where(eq(cards.id, id));
        await tx.delete(cardAttacks).where(eq(cardAttacks.cardId, id));
        updated += 1;
      } else {
        await tx.insert(cards).values({ id, ...values });
        inserted += 1;
      }
      await tx.insert(cardAttacks).values(
        card.attacks.map((attack) => ({
          id: crypto.randomUUID(),
          cardId: id,
          name: attack.name,
          damage: attack.damage,
          effectText: attack.effectText,
          effects: attack.effects,
          energyCost: attack.energyCost,
          sortOrder: attack.sortOrder,
        })),
      );
    }
  });

  console.log(`Cartas inseridas: ${inserted}. Atualizadas: ${updated}.`);
  await db.$client.end();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
