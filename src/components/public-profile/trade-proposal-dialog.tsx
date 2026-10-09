"use client";

import { TradeCardChip } from "@/components/trades/trade-card-chip";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { PokedexEntry, TradableCard } from "@/types/catalog";
import { Dialog } from "@base-ui/react/dialog";
import { Layers } from "lucide-react";
import { useState } from "react";

interface TradeProposalDialogProps {
  entry: PokedexEntry | null;
  offers: TradableCard[];
  isLoading: boolean;
  pending: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (offeredCardId: string) => void;
}

function TradeProposalDialog({
  entry,
  offers,
  isLoading,
  pending,
  error,
  onOpenChange,
  onConfirm,
}: TradeProposalDialogProps) {
  const cardName = entry?.card?.name ?? "esta carta";

  return (
    <Dialog.Root open={entry !== null} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm" />
        <Dialog.Popup className="glass bg-white/90! fixed top-1/2 left-1/2 z-50 w-[min(28rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-3xl p-6">
          <Dialog.Title className="text-lg font-semibold text-foreground">
            Propor troca
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-foreground-subtle">
            Ofereça uma carta sua por {cardName}.
          </Dialog.Description>
          <div className="mt-4">
            {isLoading ? (
              <div
                role="status"
                aria-live="polite"
                aria-busy="true"
                className="flex flex-col gap-3"
              >
                <span className="sr-only">Carregando suas cartas</span>
                {Array.from({ length: 3 }, (_, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Skeleton className="h-14 w-10 shrink-0 rounded-md" />
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            {!isLoading && offers.length === 0 ? (
              <EmptyState
                placement="section"
                icon={Layers}
                title="Nenhuma carta livre"
                description="As cartas que não estão em outra troca pendente aparecem aqui para você oferecer."
              />
            ) : null}
            {!isLoading && offers.length > 0 && entry ? (
              <TradeOfferForm
                key={entry.id}
                offers={offers}
                pending={pending}
                error={error}
                onConfirm={onConfirm}
              />
            ) : null}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function TradeOfferForm({
  offers,
  pending,
  error,
  onConfirm,
}: {
  offers: TradableCard[];
  pending: boolean;
  error: string | null;
  onConfirm: (offeredCardId: string) => void;
}) {
  const [selected, setSelected] = useState(offers[0]?.cardId ?? "");

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (selected) onConfirm(selected);
      }}
    >
      <ul className="flex max-h-80 flex-col gap-1 overflow-auto">
        {offers.map((offer) => (
          <li key={offer.cardId}>
            <button
              type="button"
              data-selected={selected === offer.cardId ? "" : undefined}
              onClick={() => setSelected(offer.cardId)}
              className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-selected:bg-primary/15 cursor-pointer"
            >
              <TradeCardChip card={offer} />
              <span className="ml-auto shrink-0 text-sm text-foreground-subtle">
                {offer.freeCount} {offer.freeCount === 1 ? "livre" : "livres"}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex justify-end gap-2">
        <Dialog.Close className="inline-flex h-10 items-center rounded-full border border-gray-300/80 bg-white/45 px-4 text-sm font-semibold text-foreground backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          Cancelar
        </Dialog.Close>
        <Button type="submit" disabled={pending || !selected}>
          Enviar proposta
        </Button>
      </div>
    </form>
  );
}

export { TradeProposalDialog };
