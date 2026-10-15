import type { Actor } from "@/server/application/actor";
import { requireAdmin } from "@/server/application/authorize";
import type { CardRepository } from "@/server/application/contracts/repositories/card-repository";
import { success, type Result } from "@/server/shared/result";
import type { AdminCatalogCard } from "@/types/catalog";

class ListAdminCards {
  constructor(private readonly cards: CardRepository) {}

  async execute(actor: Actor | null): Promise<Result<AdminCatalogCard[]>> {
    const auth = requireAdmin(actor);
    if (!auth.ok) return auth;
    return success(await this.cards.listAll());
  }
}

export { ListAdminCards };
