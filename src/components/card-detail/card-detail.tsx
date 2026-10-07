"use client";

import Link from "next/link";
import { useState } from "react";
import { formatCardNumber } from "@/lib/card-number";
import { energyStyle } from "@/lib/type-appearance";
import { attackDescription } from "@/lib/value-objects/attack-effect";
import { RARITY_LABELS, STAGE_LABELS } from "@/lib/value-objects/card";
import { useCard } from "@/hooks/use-pokedex";
import { CardZoomDialog } from "@/components/holo-card/card-zoom-dialog";
import { HoloCard } from "@/components/holo-card/holo-card";
import { EnergyMark } from "@/components/ui/energy-chip";

function CardDetail({ id }: { id: string }) {
  const card = useCard(id);
  const [zoomed, setZoomed] = useState(false);
  if (card.isLoading) return <p className="text-foreground-subtle">Carregando carta...</p>;
  if (card.isError || !card.data) {
    return <p className="text-foreground-subtle">Você ainda não tem essa carta.</p>;
  }
  const item = card.data;
  const life = Math.min(100, (item.hp / 250) * 100);
  const view = {
    name: item.name,
    imageUrl: item.imageUrl,
    rarity: item.rarity,
    hp: item.hp,
    energyType: item.energyType,
    frame: item.frame,
    stage: item.stage,
    evolvesFrom: item.evolvesFrom,
    attacks: item.attacks,
    retreatCost: item.retreatCost,
    weaknessType: item.weaknessType,
    weaknessModifier: item.weaknessModifier,
    flavorText: item.flavorText,
    imageX: item.imageX,
    imageY: item.imageY,
    imageScale: item.imageScale,
    overlayImageUrl: item.overlayImageUrl,
    overlayX: item.overlayX,
    overlayY: item.overlayY,
    overlayScale: item.overlayScale,
    decorationAsset: item.decorationAsset,
    decorationImageUrl: item.decorationImageUrl,
  };

  return (
    <div data-slot="card-detail" className="grid items-start gap-8 lg:grid-cols-[18rem_1fr]">
      <button
        type="button"
        aria-label="Ampliar carta"
        className="mx-auto w-full max-w-72 cursor-zoom-in rounded-[4%] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => setZoomed(true)}
      >
        <HoloCard {...view} />
      </button>
      <CardZoomDialog open={zoomed} onOpenChange={setZoomed} title={item.name}>
        <HoloCard {...view} effects />
      </CardZoomDialog>
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-sm font-semibold tabular-nums text-foreground-subtle">
            {formatCardNumber(item.number)}
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">{item.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <EnergyMark type={item.energyType} />
            <span className="rounded-full bg-white/60 px-3 py-1 text-sm">{STAGE_LABELS[item.stage]}</span>
            <span className="rounded-full bg-accent/15 px-3 py-1 text-sm font-medium text-accent-foreground">
              {RARITY_LABELS[item.rarity]}
            </span>
          </div>
        </div>
        <div className="glass flex flex-col gap-4 rounded-3xl p-5">
          <div>
            <div className="flex items-end justify-between gap-3">
              <p className="text-sm text-foreground-subtle">Pontos de vida</p>
              <p className="text-2xl font-semibold tabular-nums">{item.hp}</p>
            </div>
            <div data-energy={item.energyType} style={energyStyle(item.energyType)} className="mt-2 h-2 overflow-hidden rounded-full bg-white/70">
              <div className="meter-fill h-full rounded-full" style={{ width: `${life}%` }} />
            </div>
          </div>
          <p>{item.ownedCount} cópias na sua coleção</p>
          <div>
            <p className="text-sm text-foreground-subtle">Recuo</p>
            {item.retreatCost > 0 ? (
              <div className="mt-2 flex gap-1.5">
                {Array.from({ length: item.retreatCost }, (_, index) => (
                  <span key={index} className="size-3 rounded-full bg-foreground/70" />
                ))}
              </div>
            ) : (
              <p className="mt-1">Nenhum</p>
            )}
          </div>
          {item.weaknessType ? (
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm text-foreground-subtle">Fraqueza</p>
              <EnergyMark type={item.weaknessType} />
              <p className="font-semibold">+{item.weaknessModifier}</p>
            </div>
          ) : null}
          {item.evolvesFromId ? (
            <Link href={`/pokedex/${item.evolvesFromId}`} className="text-sm font-semibold text-primary">
              Ver a carta anterior
            </Link>
          ) : null}
        </div>
        <ul className="flex flex-col gap-3">
          {item.attacks.map((attack) => (
            <li key={`${attack.sortOrder}-${attack.name}`} className="glass rounded-3xl p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold">{attack.name}</p>
                <p className="text-lg font-semibold tabular-nums">{attack.damage ?? "—"}</p>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {attack.energyCost.length > 0 ? (
                  attack.energyCost.map((cost, index) => (
                    <span key={`${cost.type}-${index}`} className="inline-flex items-center gap-2">
                      <EnergyMark type={cost.type} />
                      <span className="text-sm font-semibold tabular-nums">{cost.count}</span>
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-foreground-subtle">Sem custo</p>
                )}
              </div>
              {attackDescription(attack.effectText, attack.effects) ? (
                <p className="mt-2 max-w-prose text-sm">{attackDescription(attack.effectText, attack.effects)}</p>
              ) : null}
            </li>
          ))}
        </ul>
        {item.flavorText ? <p className="max-w-prose text-sm text-foreground-subtle">{item.flavorText}</p> : null}
      </div>
    </div>
  );
}

export { CardDetail };
