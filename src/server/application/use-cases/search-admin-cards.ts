import type { Actor } from "@/server/application/actor";
import { requireAdmin } from "@/server/application/authorize";
import type { CardRepository } from "@/server/application/contracts/repositories/card-repository";
import { success, type Result } from "@/server/shared/result";
import type { CardOption } from "@/types/catalog";

const CARD_SEARCH_LIMIT = 20;

class SearchAdminCards {
  constructor(private readonly cards: CardRepository) {}

  async execute(
    input: { name: string; excludeId: string | null },
    actor: Actor | null,
  ): Promise<Result<CardOption[]>> {
    const auth = requireAdmin(actor);
    if (!auth.ok) return auth;
    return success(
      await this.cards.search({
        name: input.name,
        excludeId: input.excludeId,
        limit: CARD_SEARCH_LIMIT,
      }),
    );
  }
}

export { SearchAdminCards };
