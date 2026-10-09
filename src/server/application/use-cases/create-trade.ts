import type { Actor } from "@/server/application/actor";
import { requireUser } from "@/server/application/authorize";
import type { TradeRepository } from "@/server/application/contracts/repositories/trade-repository";
import { ConflictError, NotFoundError, ValidationError } from "@/server/shared/app-error";
import { err, success, type Result } from "@/server/shared/result";

class CreateTrade {
  constructor(private readonly trades: TradeRepository) {}

  async execute(
    input: { targetUsername: string; requestedCardId: string; offeredCardId: string },
    actor: Actor | null,
  ): Promise<Result<{ id: string }>> {
    const auth = requireUser(actor);
    if (!auth.ok) return auth;
    const target = await this.trades.findUserByUsername(input.targetUsername.toLowerCase());
    if (!target) return err(new NotFoundError("Treinador"));
    if (target.id === auth.value.id) {
      return err(new ValidationError("Você não pode trocar consigo mesmo."));
    }
    const offered = await this.trades.oldestFreeCopy(auth.value.id, input.offeredCardId);
    if (!offered) return err(new ConflictError("Você não tem uma cópia livre dessa carta."));
    const requested = await this.trades.oldestFreeCopy(target.id, input.requestedCardId);
    if (!requested) {
      return err(new ConflictError("Esse treinador não tem uma cópia livre dessa carta."));
    }
    const created = await this.trades.insert({
      fromUserId: auth.value.id,
      toUserId: target.id,
      offeredUserCardId: offered.id,
      requestedUserCardId: requested.id,
    });
    if (!created) return err(new ConflictError("Uma das cartas já está em outra proposta."));
    return success(created);
  }
}

export { CreateTrade };
