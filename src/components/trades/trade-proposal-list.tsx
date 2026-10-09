"use client";

import { useTradeActions } from "@/hooks/use-social";
import type { TradeProposalView } from "@/types/catalog";
import { TradeProposalRow } from "./trade-proposal-row";

interface TradeProposalListProps {
  proposals: TradeProposalView[];
  box: "incoming" | "outgoing";
}

function TradeProposalList({ proposals, box }: TradeProposalListProps) {
  const actions = useTradeActions();
  const error = actions.accept.error ?? actions.reject.error ?? actions.cancel.error;
  const pending = actions.accept.isPending || actions.reject.isPending || actions.cancel.isPending;

  return (
    <div data-slot="trade-proposal-list" className="flex flex-col gap-3">
      {error ? <p className="text-sm text-destructive">{error.message}</p> : null}
      <ul className="flex flex-col gap-3">
        {proposals.map((proposal) => (
          <li key={proposal.id}>
            <TradeProposalRow
              proposal={proposal}
              box={box}
              pending={pending}
              onAccept={() => actions.accept.mutate(proposal.id)}
              onReject={() => actions.reject.mutate(proposal.id)}
              onCancel={() => actions.cancel.mutate(proposal.id)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

export { TradeProposalList };
