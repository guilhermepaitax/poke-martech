import { describe, expect, it } from "vitest";
import type { GenerationStatus } from "@/lib/value-objects/card-generation";
import type {
  CardGenerationItemPatch,
  CardGenerationRepository,
  NewCardGenerationBatch,
} from "@/server/application/contracts/repositories/card-generation-repository";
import type { CardRepository } from "@/server/application/contracts/repositories/card-repository";
import type {
  CardIdea,
  CardIdeaGenerator,
  CardIdeaRequest,
} from "@/server/application/contracts/services/card-idea-generator";
import type {
  ImageGenerationRequest,
  ImageGenerator,
} from "@/server/application/contracts/services/image-generator";
import type { PokemonCardSource } from "@/server/application/contracts/services/pokemon-card-source";
import type { Card } from "@/server/application/entities/card";
import {
  CardGenerationBatch,
  CardGenerationItem,
} from "@/server/application/entities/card-generation";
import { PokemonType } from "@/server/application/entities/pokemon-type";
import type { SourcePokemon } from "@/server/application/entities/source-pokemon";
import { ProcessCardGeneration } from "@/server/application/use-cases/process-card-generation";

const MACHOP_URL = "https://www.pokemon-zone.com/cards/a1/143/machop/";

const machop: SourcePokemon = {
  externalId: "A1-143",
  name: "Machop",
  hp: 70,
  types: ["Fighting"],
  stage: "Basic",
  description: "Its whole body is composed of muscles.",
  attacks: [{ name: "Knuckle Punch", cost: ["Fighting"], damage: "20", effect: null }],
  abilities: [],
  weaknesses: [{ type: "Psychic", value: "+20" }],
  retreat: 2,
  rarity: "One Diamond",
  imageUrl: "https://assets.tcgdex.net/en/tcgp/A1/143/high.png",
};

class MemoryGenerations implements CardGenerationRepository {
  batch: CardGenerationBatch | null = null;

  seed(status: GenerationStatus, items: CardGenerationItem[]) {
    this.batch = new CardGenerationBatch(
      "batch-1",
      "admin",
      "Ana",
      "Desenvolvedora frontend que ama café.",
      "https://storage.local/ana.png",
      items.length,
      status,
      null,
      new Date(),
      new Date(),
      items,
    );
  }

  async create(batch: NewCardGenerationBatch) {
    this.seed(
      "pending",
      batch.items.map((item) => pendingItem(item.position, item.sourceUrl)),
    );
    return "batch-1";
  }

  async findById() {
    return this.batch;
  }

  async listRecent() {
    return this.batch ? [this.batch] : [];
  }

  async claim() {
    if (!this.batch || this.batch.status !== "pending") return false;
    this.setStatus("running", null);
    return true;
  }

  async updateBatch(_id: string, patch: { status: GenerationStatus; error: string | null }) {
    this.setStatus(patch.status, patch.error);
  }

  async updateItem(id: string, patch: CardGenerationItemPatch) {
    if (!this.batch) return;
    const items = this.batch.items.map((item) =>
      item.id === id
        ? new CardGenerationItem(
            item.id,
            item.position,
            item.sourceUrl,
            patch.sourceData ?? item.sourceData,
            patch.sourceImageUrl === undefined ? item.sourceImageUrl : patch.sourceImageUrl,
            patch.imagePrompt ?? item.imagePrompt,
            patch.cardId ?? item.cardId,
            patch.status ?? item.status,
            patch.error === undefined ? item.error : patch.error,
          )
        : item,
    );
    this.replace({ items });
  }

  async resetFailedItems() {
    return 0;
  }

  item(position: number) {
    const item = this.batch?.items.find((entry) => entry.position === position);
    if (!item) throw new Error("item inexistente");
    return item;
  }

  private setStatus(status: GenerationStatus, error: string | null) {
    this.replace({ status, error });
  }

  private replace(patch: Partial<{ status: GenerationStatus; error: string | null; items: CardGenerationItem[] }>) {
    const batch = this.batch;
    if (!batch) return;
    this.batch = new CardGenerationBatch(
      batch.id,
      batch.createdBy,
      batch.personName,
      batch.personDescription,
      batch.personImageUrl,
      batch.requestedCount,
      patch.status ?? batch.status,
      patch.error === undefined ? batch.error : patch.error,
      batch.createdAt,
      new Date(),
      patch.items ?? batch.items,
    );
  }
}

class MemoryCards implements CardRepository {
  created: Card[] = [];
  takenSlugs = new Set<string>();

  async listAll() {
    return [];
  }

  async listPublished() {
    return [];
  }

  async findById() {
    return null;
  }

  async findPublishedById() {
    return null;
  }

  async ownedCount() {
    return 0;
  }

  async update() {
    return { ok: true as const };
  }

  async create(card: Card) {
    if (this.takenSlugs.has(card.slug)) return { ok: false as const, reason: "conflict" as const };
    this.takenSlugs.add(card.slug);
    this.created.push(card);
    return { ok: true as const, id: `card-${this.created.length}` };
  }
}

class FakeIdeas implements CardIdeaGenerator {
  requests: CardIdeaRequest[] = [];
  names: string[] = [];

  isConfigured() {
    return true;
  }

  async generate(request: CardIdeaRequest): Promise<CardIdea[]> {
    this.requests.push(request);
    return request.inspirations.map((inspiration, index) => ({
      name: this.names[index] ?? `Criatura ${index + 1}`,
      hp: inspiration?.pokemon.hp ?? 60,
      energyType: "frontend",
      weaknessType: "backend",
      retreatCost: 1,
      rarity: "common",
      frame: "basic",
      flavorText: "Toma café o dia inteiro.",
      attacks: [{ name: "Refatorar", damage: 30, effectText: "", energyCost: [{ type: "frontend", count: 1 }] }],
      imagePrompt: `prompt-${index}`,
    }));
  }
}

class FakeImages implements ImageGenerator {
  calls: ImageGenerationRequest[] = [];
  failingPrompts = new Set<string>();

  isConfigured() {
    return true;
  }

  async generate(input: ImageGenerationRequest) {
    this.calls.push(input);
    if (this.failingPrompts.has(input.prompt)) throw new Error("fal indisponível");
    return { bytes: new Uint8Array([1, 2, 3]), contentType: "image/png" };
  }
}

function setup(items: CardGenerationItem[], status: GenerationStatus = "pending") {
  const generations = new MemoryGenerations();
  generations.seed(status, items);
  const cards = new MemoryCards();
  const ideas = new FakeIdeas();
  const images = new FakeImages();
  const artworkFetches: string[] = [];
  const source: PokemonCardSource = {
    fetchByUrl: async (url) => (url === MACHOP_URL ? machop : null),
    fetchArtwork: async (pokemon) => {
      artworkFetches.push(pokemon.externalId);
      return { bytes: new Uint8Array([4, 5, 6]), contentType: "image/webp" };
    },
  };
  const useCase = new ProcessCardGeneration(
    generations,
    cards,
    { list: async () => [new PokemonType("frontend", "Frontend"), new PokemonType("backend", "Backend")] },
    source,
    ideas,
    images,
    { upload: async (input) => `https://storage.local/${input.filename}` },
  );
  return { generations, cards, ideas, images, artworkFetches, useCase };
}

const MACHOP_ARTWORK = "https://storage.local/machop-arte.webp";

function pendingItem(position: number, sourceUrl: string | null = null) {
  return new CardGenerationItem(`item-${position}`, position, sourceUrl, null, null, null, null, "pending", null);
}

describe("ProcessCardGeneration", () => {
  it("gera cartas em rascunho com e sem Pokémon de referência", async () => {
    const { generations, cards, ideas, images, useCase } = setup([pendingItem(0, MACHOP_URL), pendingItem(1)]);

    await useCase.execute("batch-1");

    expect(generations.batch?.status).toBe("completed");
    expect(generations.item(0)).toMatchObject({ status: "done", cardId: "card-1", sourceImageUrl: MACHOP_ARTWORK });
    expect(generations.item(1)).toMatchObject({ status: "done", cardId: "card-2" });
    expect(ideas.requests).toHaveLength(1);
    expect(ideas.requests[0].inspirations).toEqual([{ pokemon: machop, artworkUrl: MACHOP_ARTWORK }, null]);
    expect(images.calls.find((call) => call.prompt === "prompt-0")).toMatchObject({
      personImageUrl: "https://storage.local/ana.png",
      inspirationImageUrl: MACHOP_ARTWORK,
    });
    expect(images.calls.find((call) => call.prompt === "prompt-1")).toMatchObject({
      personImageUrl: "https://storage.local/ana.png",
      inspirationImageUrl: null,
    });
    expect(cards.created.every((card) => !card.published && card.stage === "basic")).toBe(true);
    expect(cards.created[0].imageUrl).toBe("https://storage.local/criatura-1.png");
  });

  it("marca só o item com falha de imagem e conclui o lote", async () => {
    const { generations, images, useCase } = setup([pendingItem(0), pendingItem(1)]);
    images.failingPrompts.add("prompt-1");

    await useCase.execute("batch-1");

    expect(generations.batch?.status).toBe("completed");
    expect(generations.item(0).status).toBe("done");
    expect(generations.item(1)).toMatchObject({ status: "failed", error: "fal indisponível" });
  });

  it("falha o lote quando nenhuma carta é criada", async () => {
    const { generations, useCase } = setup([pendingItem(0, "https://www.pokemon-zone.com/cards/z9/1/nada/")]);

    await useCase.execute("batch-1");

    expect(generations.item(0).status).toBe("failed");
    expect(generations.batch).toMatchObject({ status: "failed", error: "Nenhuma carta foi gerada." });
  });

  it("no retry ignora itens já concluídos", async () => {
    const done = new CardGenerationItem("item-0", 0, null, null, null, "prompt", "card-old", "done", null);
    const { generations, cards, ideas, useCase } = setup([done, pendingItem(1, MACHOP_URL)]);

    await useCase.execute("batch-1");

    expect(ideas.requests[0].inspirations).toEqual([{ pokemon: machop, artworkUrl: MACHOP_ARTWORK }]);
    expect(cards.created).toHaveLength(1);
    expect(generations.item(0).cardId).toBe("card-old");
    expect(generations.item(1).status).toBe("done");
  });

  it("reaproveita a arte já recortada no retry", async () => {
    const item = new CardGenerationItem("item-0", 0, MACHOP_URL, machop, MACHOP_ARTWORK, null, null, "pending", null);
    const { artworkFetches, images, useCase } = setup([item]);

    await useCase.execute("batch-1");

    expect(artworkFetches).toEqual([]);
    expect(images.calls[0].inspirationImageUrl).toBe(MACHOP_ARTWORK);
  });

  it("recorta de novo quando só havia a carta inteira salva", async () => {
    const item = new CardGenerationItem("item-0", 0, MACHOP_URL, machop, machop.imageUrl, null, null, "pending", null);
    const { artworkFetches, generations, useCase } = setup([item]);

    await useCase.execute("batch-1");

    expect(artworkFetches).toEqual(["A1-143"]);
    expect(generations.item(0).sourceImageUrl).toBe(MACHOP_ARTWORK);
  });

  it("usa sufixo quando o slug já existe", async () => {
    const { cards, ideas, useCase } = setup([pendingItem(0), pendingItem(1)]);
    ideas.names = ["Café Turbo", "Café Turbo"];
    cards.takenSlugs.add("cafe-turbo");

    await useCase.execute("batch-1");

    expect(cards.created.map((card) => card.slug).sort()).toEqual(["cafe-turbo-2", "cafe-turbo-3"]);
  });

  it("não processa um lote que não está na fila", async () => {
    const { ideas, useCase } = setup([pendingItem(0)], "running");

    await useCase.execute("batch-1");

    expect(ideas.requests).toHaveLength(0);
  });
});
