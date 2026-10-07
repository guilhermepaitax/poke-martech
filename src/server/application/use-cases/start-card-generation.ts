import { MAX_GENERATION_CARDS } from "@/lib/value-objects/card-generation";
import type { Actor } from "@/server/application/actor";
import { requireAdmin } from "@/server/application/authorize";
import type { CardGenerationRepository } from "@/server/application/contracts/repositories/card-generation-repository";
import type { CardIdeaGenerator } from "@/server/application/contracts/services/card-idea-generator";
import type { ImageGenerator } from "@/server/application/contracts/services/image-generator";
import { ValidationError } from "@/server/shared/app-error";
import { err, success, type Result } from "@/server/shared/result";
import type { CardGenerationInput } from "@/types/catalog";

class StartCardGeneration {
  constructor(
    private readonly generations: CardGenerationRepository,
    private readonly ideas: CardIdeaGenerator,
    private readonly images: ImageGenerator,
  ) {}

  async execute(input: CardGenerationInput, actor: Actor | null): Promise<Result<{ id: string }>> {
    const auth = requireAdmin(actor);
    if (!auth.ok) return auth;
    if (!this.ideas.isConfigured()) {
      return err(new ValidationError("Geração de textos não configurada (OPENAI_API_KEY)."));
    }
    if (!this.images.isConfigured()) {
      return err(new ValidationError("Geração de imagens não configurada (OPENAI_API_KEY)."));
    }
    const sourceUrls = [...new Set(input.sourceUrls)];
    const items =
      sourceUrls.length > 0
        ? sourceUrls.map((sourceUrl, position) => ({ position, sourceUrl }))
        : Array.from({ length: input.count ?? 0 }, (_, position) => ({ position, sourceUrl: null }));
    if (items.length === 0) {
      return err(new ValidationError("Informe links de Pokémon ou a quantidade de cartas."));
    }
    if (items.length > MAX_GENERATION_CARDS) {
      return err(new ValidationError(`Gere no máximo ${MAX_GENERATION_CARDS} cartas por vez.`));
    }
    const id = await this.generations.create({
      createdBy: auth.value.id,
      personName: input.personName,
      personDescription: input.personDescription,
      personImageUrl: input.personImageUrl,
      items,
    });
    return success({ id });
  }
}

export { StartCardGeneration };
