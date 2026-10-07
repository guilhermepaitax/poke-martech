import { slugify } from "@/lib/slug";
import { toCardEntity } from "@/server/application/card-input";
import type { CardGenerationRepository } from "@/server/application/contracts/repositories/card-generation-repository";
import type { CardRepository } from "@/server/application/contracts/repositories/card-repository";
import type { PokemonTypeRepository } from "@/server/application/contracts/repositories/pokemon-type-repository";
import type {
  CardIdea,
  CardIdeaGenerator,
} from "@/server/application/contracts/services/card-idea-generator";
import type { ImageGenerator } from "@/server/application/contracts/services/image-generator";
import type { ObjectStorage } from "@/server/application/contracts/services/object-storage";
import type { PokemonCardSource } from "@/server/application/contracts/services/pokemon-card-source";
import type {
  CardGenerationBatch,
  CardGenerationItem,
} from "@/server/application/entities/card-generation";
import type {
  CardInspiration,
  SourcePokemon,
} from "@/server/application/entities/source-pokemon";
import { success, type Result } from "@/server/shared/result";
import type { CardInput } from "@/types/catalog";

const IMAGE_CONCURRENCY = 2;
const SLUG_ATTEMPTS = 5;

type ReadyItem = {
  item: CardGenerationItem;
  inspiration: CardInspiration | null;
};

class ProcessCardGeneration {
  constructor(
    private readonly generations: CardGenerationRepository,
    private readonly cards: CardRepository,
    private readonly types: PokemonTypeRepository,
    private readonly source: PokemonCardSource,
    private readonly ideas: CardIdeaGenerator,
    private readonly images: ImageGenerator,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(id: string): Promise<Result<void>> {
    if (!(await this.generations.claim(id))) return success(undefined);
    try {
      const batch = await this.generations.findById(id);
      if (batch) await this.run(batch);
      await this.finish(id);
    } catch (error) {
      await this.generations.updateBatch(id, { status: "failed", error: messageOf(error) });
    }
    return success(undefined);
  }

  private async run(batch: CardGenerationBatch) {
    const ready = await this.resolveSources(batch.items.filter((item) => item.status === "pending"));
    if (ready.length === 0) return;

    let ideas: CardIdea[];
    try {
      const allowedTypes = await this.types.list();
      ideas = await this.ideas.generate({
        person: {
          name: batch.personName,
          description: batch.personDescription,
          imageUrl: batch.personImageUrl,
        },
        inspirations: ready.map((entry) => entry.inspiration),
        allowedTypes: allowedTypes.map((type) => ({ code: type.code, name: type.name })),
      });
    } catch (error) {
      await this.failAll(ready, messageOf(error));
      return;
    }

    await forEachWithConcurrency(ready, IMAGE_CONCURRENCY, async (entry, index) => {
      const idea = ideas[index];
      if (!idea) {
        await this.fail(entry.item, "A IA não gerou dados para esta carta.");
        return;
      }
      try {
        const cardId = await this.createCard(batch, entry, idea);
        await this.generations.updateItem(entry.item.id, { cardId, status: "done", error: null });
      } catch (error) {
        await this.fail(entry.item, messageOf(error));
      }
    });
  }

  private async resolveSources(items: CardGenerationItem[]): Promise<ReadyItem[]> {
    const ready: ReadyItem[] = [];
    for (const item of items) {
      if (!item.sourceUrl) {
        ready.push({ item, inspiration: null });
        continue;
      }
      try {
        const pokemon = item.sourceData ?? (await this.source.fetchByUrl(item.sourceUrl));
        if (!pokemon) {
          await this.fail(item, "Não encontramos essa carta na base de dados de Pokémon.");
          continue;
        }
        const hasArtwork = Boolean(item.sourceImageUrl) && item.sourceImageUrl !== pokemon.imageUrl;
        const artworkUrl = hasArtwork ? item.sourceImageUrl : await this.storeArtwork(pokemon);
        if (!item.sourceData || artworkUrl !== item.sourceImageUrl) {
          await this.generations.updateItem(item.id, { sourceData: pokemon, sourceImageUrl: artworkUrl });
        }
        ready.push({ item, inspiration: { pokemon, artworkUrl } });
      } catch (error) {
        await this.fail(item, messageOf(error));
      }
    }
    return ready;
  }

  private async storeArtwork(pokemon: SourcePokemon) {
    try {
      const artwork = await this.source.fetchArtwork(pokemon);
      if (!artwork) return pokemon.imageUrl;
      return await this.storage.upload({
        body: artwork.bytes,
        contentType: artwork.contentType,
        filename: `${slugify(pokemon.name) || "pokemon"}-arte.${extensionOf(artwork.contentType)}`,
      });
    } catch {
      return pokemon.imageUrl;
    }
  }

  private async createCard(batch: CardGenerationBatch, entry: ReadyItem, idea: CardIdea) {
    await this.generations.updateItem(entry.item.id, { imagePrompt: idea.imagePrompt });
    const image = await this.images.generate({
      prompt: idea.imagePrompt,
      personImageUrl: batch.personImageUrl,
      inspirationImageUrl: entry.inspiration?.artworkUrl ?? null,
    });
    const baseSlug = slugify(idea.name) || "carta";
    const imageUrl = await this.storage.upload({
      body: image.bytes,
      contentType: image.contentType,
      filename: `${baseSlug}.${extensionOf(image.contentType)}`,
    });

    for (let attempt = 0; attempt <= SLUG_ATTEMPTS; attempt += 1) {
      const slug = slugCandidate(baseSlug, attempt);
      const created = await this.cards.create(toCardEntity("", toCardInput(idea, slug, imageUrl)));
      if (created.ok) return created.id;
    }
    throw new Error("Não foi possível gerar um identificador único para a carta.");
  }

  private async finish(id: string) {
    const batch = await this.generations.findById(id);
    if (!batch) return;
    const hasCards = batch.items.some((item) => item.status === "done");
    await this.generations.updateBatch(id, {
      status: hasCards ? "completed" : "failed",
      error: hasCards ? null : "Nenhuma carta foi gerada.",
    });
  }

  private async fail(item: CardGenerationItem, error: string) {
    await this.generations.updateItem(item.id, { status: "failed", error });
  }

  private async failAll(ready: ReadyItem[], error: string) {
    for (const entry of ready) await this.fail(entry.item, error);
  }
}

function toCardInput(idea: CardIdea, slug: string, imageUrl: string): CardInput {
  return {
    name: idea.name,
    slug,
    imageUrl,
    imageX: 50,
    imageY: 50,
    imageScale: 100,
    overlayImageUrl: null,
    overlayX: 50,
    overlayY: 50,
    overlayScale: 100,
    decorationAsset: null,
    decorationImageUrl: null,
    hp: idea.hp,
    energyType: idea.energyType,
    stage: "basic",
    frame: idea.frame,
    rarity: idea.rarity,
    published: false,
    evolvesFromId: null,
    retreatCost: idea.retreatCost,
    weaknessType: idea.weaknessType,
    weaknessModifier: 20,
    flavorText: idea.flavorText,
    attacks: idea.attacks.map((attack, sortOrder) => ({ ...attack, effects: [], sortOrder })),
  };
}

function slugCandidate(base: string, attempt: number) {
  if (attempt === 0) return base;
  if (attempt < SLUG_ATTEMPTS) return `${base}-${attempt + 1}`;
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

function extensionOf(contentType: string) {
  if (contentType === "image/jpeg") return "jpg";
  if (contentType === "image/webp") return "webp";
  return "png";
}

function messageOf(error: unknown) {
  const message = error instanceof Error && error.message ? error.message : "Erro inesperado.";
  return message.slice(0, 300);
}

async function forEachWithConcurrency<T>(
  items: T[],
  limit: number,
  task: (item: T, index: number) => Promise<void>,
) {
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next;
      next += 1;
      await task(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}

export { ProcessCardGeneration };
