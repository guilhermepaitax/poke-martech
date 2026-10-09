import { TradeCardChip } from "@/components/trades/trade-card-chip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TradeProposalView, TradeStatus } from "@/types/catalog";

const STATUS_LABEL: Record<TradeStatus, string> = {
  pending: "Pendente",
  accepted: "Aceita",
  rejected: "Recusada",
  cancelled: "Cancelada",
};

interface TradeProposalRowProps {
  proposal: TradeProposalView;
  box: "incoming" | "outgoing";
  pending: boolean;
  onAccept: () => void;
  onReject: () => void;
  onCancel: () => void;
}

function TradeProposalRow({
  proposal,
  box,
  pending,
  onAccept,
  onReject,
  onCancel,
}: TradeProposalRowProps) {
  const waiting = proposal.status === "pending";
  const counterpart = box === "incoming" ? proposal.from : proposal.to;

  return (
    <article data-slot="trade-proposal-row" className="glass flex flex-col gap-4 rounded-3xl p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-foreground-subtle">
          {box === "incoming" ? "De" : "Para"} @{counterpart.username}
        </p>
        <Badge variant={waiting ? "accent" : "outline"}>{STATUS_LABEL[proposal.status]}</Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <p className="text-xs text-foreground-subtle">Oferece</p>
          <TradeCardChip card={proposal.offered} />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-xs text-foreground-subtle">Pede</p>
          <TradeCardChip card={proposal.requested} />
        </div>
      </div>
      {waiting && box === "incoming" ? (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={pending} onClick={onAccept}>
            Aceitar
          </Button>
          <Button size="sm" variant="outline" disabled={pending} onClick={onReject}>
            Recusar
          </Button>
        </div>
      ) : null}
      {waiting && box === "outgoing" ? (
        <Button size="sm" variant="outline" disabled={pending} onClick={onCancel}>
          Cancelar
        </Button>
      ) : null}
    </article>
  );
}

export { TradeProposalRow };
