"use client";

import { Booster3D } from "@/components/booster-3d/booster-3d";
import { CardZoomDialog } from "@/components/holo-card/card-zoom-dialog";
import { HoloCard } from "@/components/holo-card/holo-card";
import { Button } from "@/components/ui/button";
import { openingCardView } from "./opening-card-view";
import { PackOpeningStack } from "./pack-opening-stack";
import { PackOpeningSummary } from "./pack-opening-summary";
import { usePackOpening } from "./use-pack-opening";

function PackOpening({ id }: { id: string }) {
  const state = usePackOpening(id);

  if (state.opening.isLoading) {
    return <p className="text-foreground-subtle">Abrindo o pacote...</p>;
  }
  if (state.opening.isError || !state.opening.data) {
    return <p className="text-destructive">Não foi possível carregar essa abertura.</p>;
  }

  const opening = state.opening.data;
  const total = opening.cards.length;
  const zoomedCard = state.zoomedIndex == null ? null : opening.cards[state.zoomedIndex];
  const subtitle =
    state.phase === "stack"
      ? `Carta ${state.current + 1} de ${total}`
      : state.phase === "summary"
        ? `${total} cartas`
        : "Toque para abrir";

  return (
    <div data-slot="pack-opening" className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">{opening.boosterName}</h1>
        <p className="text-sm text-foreground-subtle">{subtitle}</p>
      </div>
      {state.phase === "sealed" || state.phase === "ripping" ? (
        <div className="w-56">
          <Booster3D
            name={opening.boosterName}
            imageUrl={opening.boosterImageUrl}
            finish={opening.boosterFinish}
            ripping={state.phase === "ripping"}
          />
          <Button className="mt-6 w-full" size="lg" onClick={state.open} disabled={state.phase === "ripping"}>
            Abrir pacote
          </Button>
        </div>
      ) : state.phase === "stack" ? (
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
      <CardZoomDialog
        open={zoomedCard != null}
        onOpenChange={(open) => {
          if (!open) state.closeZoom();
        }}
        title={zoomedCard?.name}
      >
        {zoomedCard ? <HoloCard {...openingCardView(zoomedCard)} effects /> : null}
      </CardZoomDialog>
    </div>
  );
}

export { PackOpening };
