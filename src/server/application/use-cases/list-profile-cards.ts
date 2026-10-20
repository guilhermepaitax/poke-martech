import type { Actor } from "@/server/application/actor";
import { requireUser } from "@/server/application/authorize";
import type {
  PokedexRepository,
  ProfileRepository,
} from "@/server/application/contracts/repositories/profile-repository";
import { toPage } from "@/server/application/page";
import type { PokedexQuery } from "@/server/application/use-cases/list-pokedex-page";
import { NotFoundError } from "@/server/shared/app-error";
import { err, success, type Result } from "@/server/shared/result";
import type { PublicPokedexPage } from "@/types/catalog";

class ListProfileCards {
  constructor(
    private readonly profiles: ProfileRepository,
    private readonly pokedex: PokedexRepository,
  ) {}

  async execute(
    input: PokedexQuery & { username: string },
    actor: Actor | null,
  ): Promise<Result<PublicPokedexPage>> {
    const auth = requireUser(actor);
    if (!auth.ok) return auth;
    const profile = await this.profiles.findPublicByUsername(input.username.toLowerCase());
    if (!profile) return err(new NotFoundError("Perfil"));
    const filters = { query: input.q, type: input.tipo ?? null, sort: input.ordem, ownedOnly: true };
    const [slice, totals] = await Promise.all([
      this.pokedex.page(profile.id, filters, input),
      this.pokedex.totals(profile.id),
    ]);
    const isSelf = profile.id === auth.value.id;
    const viewerOwned = isSelf
      ? null
      : new Set(
          await this.pokedex.ownedCardIdsAmong(
            auth.value.id,
            slice.items.map((entry) => entry.id),
          ),
        );
    const page = toPage(slice, input);
    return success({
      ...page,
      items: page.items.map((entry) => ({
        ...entry,
        viewerOwns: viewerOwned === null || viewerOwned.has(entry.id),
      })),
      total: totals.owned,
    });
  }
}

export { ListProfileCards };
