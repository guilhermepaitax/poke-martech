import { cardToFighter, type ArenaMatchup } from "@/lib/arena/fighter";
import type { CardRepository } from "@/server/application/contracts/repositories/card-repository";
import { NotFoundError } from "@/server/shared/app-error";
import { err, success, type Result } from "@/server/shared/result";

const ARENA_FIGHTER_SLUGS = {
  player: "a1-001-calvassauro",
  opponent: "a1-005-rafrpie",
} as const;

class GetArenaFighters {
  constructor(private readonly cards: CardRepository) {}

  async execute(): Promise<Result<ArenaMatchup>> {
    const player = await this.cards.findPublishedBySlug(
      ARENA_FIGHTER_SLUGS.player,
    );
    const opponent = await this.cards.findPublishedBySlug(
      ARENA_FIGHTER_SLUGS.opponent,
    );
    if (!player || !opponent) return err(new NotFoundError("Lutador"));

    return success({
      player: cardToFighter(player),
      opponent: cardToFighter(opponent),
    });
  }
}

export { ARENA_FIGHTER_SLUGS, GetArenaFighters };
