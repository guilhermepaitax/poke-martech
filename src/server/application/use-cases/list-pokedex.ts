import type { Actor } from "@/server/application/actor";
import { requireUser } from "@/server/application/authorize";
import type { PokedexRepository } from "@/server/application/contracts/repositories/profile-repository";
import { success, type Result } from "@/server/shared/result";
import type { PokedexEntry } from "@/types/catalog";

class ListPokedex {
  constructor(private readonly pokedex: PokedexRepository) {}

  async execute(actor: Actor | null): Promise<Result<PokedexEntry[]>> {
    const auth = requireUser(actor);
    if (!auth.ok) return auth;
    return success(await this.pokedex.listForUser(auth.value.id));
  }
}

export { ListPokedex };
