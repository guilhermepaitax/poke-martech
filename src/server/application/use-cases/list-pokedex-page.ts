import type { EnergyType } from "@/lib/value-objects/card";
import type { PokedexSortKey } from "@/lib/value-objects/pokedex";
import type { Actor } from "@/server/application/actor";
import { requireUser } from "@/server/application/authorize";
import type { PokedexRepository } from "@/server/application/contracts/repositories/profile-repository";
import { toPage, type PageRequest } from "@/server/application/page";
import { success, type Result } from "@/server/shared/result";
import type { PokedexPage } from "@/types/catalog";

type PokedexQuery = PageRequest & {
  q: string;
  tipo?: EnergyType;
  ordem: PokedexSortKey;
};

class ListPokedexPage {
  constructor(private readonly pokedex: PokedexRepository) {}

  async execute(input: PokedexQuery, actor: Actor | null): Promise<Result<PokedexPage>> {
    const auth = requireUser(actor);
    if (!auth.ok) return auth;
    const filters = { query: input.q, type: input.tipo ?? null, sort: input.ordem, ownedOnly: false };
    const [slice, totals] = await Promise.all([
      this.pokedex.page(auth.value.id, filters, input),
      this.pokedex.totals(auth.value.id),
    ]);
    return success({ ...toPage(slice, input), ...totals });
  }
}

export { ListPokedexPage };
export type { PokedexQuery };
