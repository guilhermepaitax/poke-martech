"use client";

import { CardZoomDialog } from "@/components/holo-card/card-zoom-dialog";
import { HoloCard } from "@/components/holo-card/holo-card";
import { openingCardView } from "./opening-card-view";
import { PackOpeningStack } from "./pack-opening-stack";
import {
  PackOpeningFrame,
  PackOpeningLoading,
  PackOpeningSealed,
  cardCountLabel,
  openingIntensity,
} from "./pack-opening-stage";
import { PackOpeningSummary } from "./pack-opening-summary";
import { usePackOpening } from "./use-pack-opening";

function PackOpening({ id }: { id: string }) {
  const state = usePackOpening(id);

  if (state.opening.isLoading) {
    return (
      <PackOpeningFrame phase="loading" intensity="low" centered>
        <PackOpeningLoading />
      </PackOpeningFrame>
    );
  }

  if (state.opening.isError || !state.opening.data) {
    return (
      <PackOpeningFrame phase="sealed" intensity="low" centered>
        <p className="text-center text-destructive">Não foi possível carregar essa abertura.</p>
      </PackOpeningFrame>
    );
  }

  const opening = state.opening.data;
  const total = opening.cards.length;
  const top = state.phase === "stack" ? opening.cards[state.current] : undefined;
  const zoomedCard = state.zoomedIndex == null ? null : opening.cards[state.zoomedIndex];
  const subtitle =
    state.phase === "stack" ? `Carta ${state.current + 1} de ${total}` : cardCountLabel(total);

  return (
    <PackOpeningFrame
      phase={state.phase}
      intensity={top ? openingIntensity(top.rarity) : "low"}
      burstKey={state.phase === "stack" ? state.current : undefined}
      energyType={top?.energyType}
      centered={state.phase !== "summary"}
    >
      {state.phase === "sealed" || state.phase === "ripping" ? (
        <PackOpeningSealed
          name={opening.boosterName}
          imageUrl={opening.boosterImageUrl}
          finish={opening.boosterFinish}
          count={total}
          ripping={state.phase === "ripping"}
          onOpen={state.open}
        />
      ) : (
        <>
          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight text-balance">{opening.boosterName}</h1>
            <p className="text-sm text-foreground-subtle">{subtitle}</p>
          </div>
          {state.phase === "stack" ? (
            <PackOpeningStack
              cards={opening.cards}
              current={state.current}
              sending={state.sending}
              topCardRef={state.topCardRef}
              onPass={state.pass}
              onSendEnd={state.onSendEnd}
            />
          ) : (
            <PackOpeningSummary cards={opening.cards} onSelect={state.select} onStoreAll={state.storeAll} />
          )}
        </>
      )}
      <CardZoomDialog
        open={zoomedCard != null}
        onOpenChange={(open) => {
          if (!open) state.closeZoom();
        }}
        title={zoomedCard?.name}
      >
        {zoomedCard ? <HoloCard {...openingCardView(zoomedCard)} effects /> : null}
      </CardZoomDialog>
    </PackOpeningFrame>
  );
}

export { PackOpening };
