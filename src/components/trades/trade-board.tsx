"use client";

import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { EmptyState, screenColumnClass } from "@/components/ui/empty-state";
import { ProposalSkeleton } from "@/components/ui/skeleton";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useTrades } from "@/hooks/use-social";
import { cn } from "@/lib/utils";
import { TradeProposalList } from "./trade-proposal-list";

function TradeBoard() {
  const [box, setBox] = useState<"incoming" | "outgoing">("incoming");
  const trades = useTrades(box);

  const empty = trades.data?.length === 0;

  return (
    <div
      data-slot="trade-board"
      className={cn("flex flex-col gap-6", empty && screenColumnClass)}
    >
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">Trocas</h1>
        <p className="mt-2 max-w-prose text-foreground-subtle">
          Propostas que você recebeu e as que enviou.
        </p>
      </div>
      <SegmentedControl
        ariaLabel="Caixa de propostas"
        value={box}
        onValueChange={(value) => setBox(value as "incoming" | "outgoing")}
        options={[
          { value: "incoming", label: "Recebidas" },
          { value: "outgoing", label: "Enviadas" },
        ]}
      />
      {trades.isLoading ? (
        <div role="status" aria-live="polite" aria-busy="true" className="flex flex-col gap-3">
          <span className="sr-only">Carregando propostas</span>
          <ProposalSkeleton />
          <ProposalSkeleton />
          <ProposalSkeleton />
        </div>
      ) : null}
      {trades.isError ? (
        <p className="text-destructive">Não foi possível carregar as propostas.</p>
      ) : null}
      {empty ? (
        <EmptyState
          placement="fill"
          icon={ArrowLeftRight}
          title={box === "incoming" ? "Nenhuma proposta recebida" : "Nenhuma proposta enviada"}
          description={
            box === "incoming"
              ? "Quando alguém oferecer uma carta sua, a proposta aparece nesta caixa."
              : "Abra o perfil de outro treinador e ofereça uma carta da sua coleção."
          }
        />
      ) : null}
      {trades.data && trades.data.length > 0 ? (
        <TradeProposalList proposals={trades.data} box={box} />
      ) : null}
    </div>
  );
}

export { TradeBoard };
