import type { Actor } from "@/server/application/actor";
import { requireUser } from "@/server/application/authorize";
import type { TradeRepository } from "@/server/application/contracts/repositories/trade-repository";
import { success, type Result } from "@/server/shared/result";
import type { TradableCard } from "@/types/catalog";

class ListTradableCards {
  constructor(private readonly trades: TradeRepository) {}

  async execute(actor: Actor | null): Promise<Result<TradableCard[]>> {
    const auth = requireUser(actor);
    if (!auth.ok) return auth;
    return success(await this.trades.listFreeOffers(auth.value.id));
  }
}

export { ListTradableCards };
