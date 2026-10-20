import type { Actor } from "@/server/application/actor";
import { requireUser } from "@/server/application/authorize";
import type { TradeRepository } from "@/server/application/contracts/repositories/trade-repository";
import { success, type Result } from "@/server/shared/result";
import { toPage, type PageRequest } from "@/server/application/page";
import type { Page, TradeProposalView } from "@/types/catalog";

class ListTrades {
  constructor(private readonly trades: TradeRepository) {}

  async execute(
    input: { box: "incoming" | "outgoing" } & PageRequest,
    actor: Actor | null,
  ): Promise<Result<Page<TradeProposalView>>> {
    const auth = requireUser(actor);
    if (!auth.ok) return auth;
    return success(toPage(await this.trades.list(auth.value.id, input.box, input), input));
  }
}

export { ListTrades };
