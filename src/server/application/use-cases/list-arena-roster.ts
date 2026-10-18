import { cardToFighter, type ArenaRoster } from "@/lib/arena/fighter";
import type { CardRepository } from "@/server/application/contracts/repositories/card-repository";
import { ARENA_FIGHTER_SLUGS } from "@/server/application/use-cases/get-arena-fighters";
import { NotFoundError } from "@/server/shared/app-error";
import { err, success, type Result } from "@/server/shared/result";

class ListArenaRoster {
  constructor(private readonly cards: CardRepository) {}

  async execute(): Promise<Result<ArenaRoster>> {
    const published = await this.cards.listPublishedCards();
    if (published.length < 2) return err(new NotFoundError("Lutador"));

    const player = published.find(
      (item) => item.slug === ARENA_FIGHTER_SLUGS.player,
    );
    const opponent = published.find(
      (item) => item.slug === ARENA_FIGHTER_SLUGS.opponent,
    );
    const playerId = player?.id ?? null;
    const opponentId =
      opponent && opponent.id !== playerId ? opponent.id : null;

    return success({
      fighters: published.map((item) => ({
        id: item.id,
        face: item.face,
        fighter: cardToFighter({
          id: item.id,
          name: item.face.name,
          hp: item.face.hp,
          imageUrl: item.face.imageUrl,
          attacks: item.face.attacks,
        }),
      })),
      playerId,
      opponentId,
    });
  }
}

export { ListArenaRoster };
