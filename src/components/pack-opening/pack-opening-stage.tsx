"use client";

import { Booster3D } from "@/components/booster-3d/booster-3d";
import { useHoloTilt } from "@/components/holo-card/use-holo-tilt";
import { Button } from "@/components/ui/button";
import { LoadingScreen, Skeleton } from "@/components/ui/skeleton";
import { energyStyle } from "@/lib/type-appearance";
import { cn } from "@/lib/utils";
import {
  RARITY_RANK,
  type EnergyType,
  type Finish,
  type Rarity,
} from "@/lib/value-objects/card";
import type { ReactNode } from "react";
import type { PackOpeningPhase } from "./use-pack-opening";

type PackOpeningStagePhase = PackOpeningPhase | "loading";
type PackOpeningIntensity = "low" | "mid" | "high";

const PACK_STAGE_WIDTH =
  "w-[min(16rem,calc((100dvh-24rem)*2/3))] sm:w-[min(18rem,calc((100dvh-22rem)*2/3))]";

const MOTES = [
  { left: "14%", top: "28%", delay: "0s", duration: "11s", size: "3px" },
  { left: "24%", top: "64%", delay: "1.6s", duration: "13s", size: "2px" },
  { left: "68%", top: "22%", delay: "0.8s", duration: "12s", size: "2px" },
  { left: "80%", top: "46%", delay: "2.4s", duration: "14s", size: "4px" },
  { left: "46%", top: "74%", delay: "1.2s", duration: "10s", size: "2px" },
  { left: "34%", top: "16%", delay: "3s", duration: "15s", size: "3px" },
  { left: "88%", top: "68%", delay: "0.4s", duration: "12.5s", size: "2px" },
] as const;

function cardCountLabel(count: number) {
  return count === 1 ? "1 carta" : `${count} cartas`;
}

function openingIntensity(rarity: Rarity): PackOpeningIntensity {
  if (RARITY_RANK[rarity] >= RARITY_RANK.super_rare) return "high";
  if (RARITY_RANK[rarity] >= RARITY_RANK.rare) return "mid";
  return "low";
}

function PackOpeningAtmosphere({
  phase,
  intensity,
  burstKey,
  energyType,
}: {
  phase: PackOpeningStagePhase;
  intensity: PackOpeningIntensity;
  burstKey?: number;
  energyType?: EnergyType;
}) {
  const tiltRef = useHoloTilt();

  return (
    <div
      ref={tiltRef}
      aria-hidden
      data-slot="pack-opening-atmosphere"
      data-phase={phase}
      data-intensity={intensity}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={energyType ? energyStyle(energyType) : undefined}
    >
      <div className="pack-opening-pool" />
      <div className="pack-opening-flash" />
      {MOTES.map((mote) => (
        <span
          key={`${mote.left}-${mote.top}`}
          className="pack-opening-mote"
          style={{
            left: mote.left,
            top: mote.top,
            width: mote.size,
            height: mote.size,
            animationDelay: mote.delay,
            animationDuration: mote.duration,
          }}
        />
      ))}
      {burstKey != null ? (
        <div key={burstKey} className="pack-opening-burst" />
      ) : null}
    </div>
  );
}

function PackOpeningFrame({
  phase,
  intensity,
  burstKey,
  energyType,
  centered = false,
  children,
}: {
  phase: PackOpeningStagePhase;
  intensity: PackOpeningIntensity;
  burstKey?: number;
  energyType?: EnergyType;
  centered?: boolean;
  children: ReactNode;
}) {
  return (
    <div data-slot="pack-opening" className="relative">
      <PackOpeningAtmosphere
        phase={phase}
        intensity={intensity}
        burstKey={burstKey}
        energyType={energyType}
      />
      <div
        className={cn(
          "relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center gap-8",
          centered && "min-h-[70dvh] justify-center",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function PackOpeningLoading() {
  return (
    <div data-slot="pack-opening-loading" className={PACK_STAGE_WIDTH}>
      <LoadingScreen label="Preparando o pacote">
        <Skeleton className="aspect-2/3 w-full rounded-2xl opacity-65" />
      </LoadingScreen>
    </div>
  );
}

function PackOpeningSealed({
  name,
  imageUrl,
  finish,
  count,
  ripping,
  onOpen,
}: {
  name: string;
  imageUrl: string | null;
  finish: Finish;
  count: number;
  ripping: boolean;
  onOpen: () => void;
}) {
  return (
    <div
      data-slot="pack-opening-sealed"
      className={cn("flex flex-col items-center gap-8", PACK_STAGE_WIDTH)}
    >
      <div className="flex min-h-[4.5rem] flex-col items-center justify-center gap-1 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-balance">
          {name}
        </h1>
        <p className="text-sm text-foreground-subtle">
          {cardCountLabel(count)}
        </p>
      </div>
      <div className="relative w-full">
        <div aria-hidden className="pack-opening-floor" />
        <Booster3D
          name={name}
          imageUrl={imageUrl}
          finish={finish}
          ripping={ripping}
          className="w-full"
        />
      </div>
      <Button className="w-full" size="lg" onClick={onOpen} disabled={ripping}>
        Abrir pacote
      </Button>
    </div>
  );
}

export {
  cardCountLabel,
  openingIntensity,
  PackOpeningAtmosphere,
  PackOpeningFrame,
  PackOpeningLoading,
  PackOpeningSealed,
};
export type { PackOpeningIntensity, PackOpeningStagePhase };
