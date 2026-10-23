"use client";

import type { ArenaFighter } from "@/lib/arena/fighter";
import type { ArenaMap, MapTrait } from "@/lib/arena/map";
import { RANDOM_MAP_ID, type ArenaSide } from "@/lib/arena/selection";
import type { ArenaMode } from "@/lib/arena/tutorial";
import { cn } from "@/lib/utils";
import { ArrowLeft, Droplets, GraduationCap, Mountain, Shuffle, Swords, Zap, type LucideIcon } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import { ArenaActionButton } from "./arena-action-button";
import { ArenaPanelSection } from "./arena-panel-section";
import { ArenaMatchupSlots } from "./fighter-roster";

const RANDOM_MAP = {
  name: "Aleatório",
  title: "Arena surpresa, sorteada na luta",
  description: "Uma das arenas será sorteada quando a luta começar.",
} as const;

const TRAIT_ICON: Record<MapTrait["tone"], LucideIcon> = {
  water: Droplets,
  boost: Zap,
  neutral: Mountain,
};

function MapBanner({
  maps,
  map,
  random,
  className,
}: {
  maps: readonly ArenaMap[];
  map: ArenaMap | null;
  random: boolean;
  className?: string;
}) {
  return (
    <div data-slot="arena-map-banner" aria-hidden className={cn("overflow-hidden", className)}>
      {maps.map((item, index) => (
        <Image
          key={item.id}
          src={item.background.path}
          alt=""
          fill
          priority={index === 0}
          sizes="(min-width: 1152px) 1152px, 100vw"
          data-hidden={random || item.id !== map?.id ? "" : undefined}
          data-pixel={item.background.pixelArt ? "" : undefined}
          className="arena-banner object-cover"
        />
      ))}
      {random ? (
        <div className="absolute inset-0 flex">
          {maps.map((item) => (
            <div key={item.id} className="relative flex-1 opacity-60 grayscale-[40%]">
              <Image src={item.background.path} alt="" fill sizes="50vw" className="object-cover" />
            </div>
          ))}
        </div>
      ) : null}
      <div className="arena-banner-shade absolute inset-0" />
    </div>
  );
}

function MapTile({
  label,
  current,
  onClick,
  children,
}: {
  label: string;
  current: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <li>
      <button
        type="button"
        data-slot="arena-map-tile"
        data-current={current ? "" : undefined}
        aria-pressed={current}
        aria-label={label}
        onClick={onClick}
        className="arena-map-tile group flex w-full flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--arena-cta)"
      >
        <span className="relative block aspect-video w-full overflow-hidden bg-(--arena-line)">{children}</span>
        <span className="truncate px-2 py-1.5 font-arena-title text-[11px] leading-tight uppercase">{label}</span>
      </button>
    </li>
  );
}

function ArenaMapPicker({
  maps,
  map,
  random,
  player,
  opponent,
  fighterRandom,
  mode,
  onChoose,
  onBack,
  onFight,
}: {
  maps: readonly ArenaMap[];
  map: ArenaMap | null;
  random: boolean;
  player: ArenaFighter | null;
  opponent: ArenaFighter | null;
  fighterRandom: Record<ArenaSide, boolean>;
  mode: ArenaMode;
  onChoose: (id: string) => void;
  onBack: (side?: ArenaSide) => void;
  onFight: () => void;
}) {
  const name = random ? RANDOM_MAP.name : map?.name;
  const title = random ? RANDOM_MAP.title : map?.title;
  const description = random ? RANDOM_MAP.description : map?.description;
  const traits = random ? [] : (map?.traits ?? []);
  const tutorial = mode === "tutorial";

  return (
    <div
      data-slot="arena-map-picker"
      className="arena-picker relative isolate overflow-hidden rounded-[28px] lg:grid lg:min-h-[40rem] lg:grid-cols-[minmax(0,1fr)_30rem]"
    >
      <MapBanner
        maps={maps}
        map={map}
        random={random}
        className="absolute inset-x-0 top-0 -z-10 aspect-[4/3] sm:aspect-video lg:inset-0 lg:aspect-auto"
      />

      <div className="flex aspect-[4/3] flex-col items-start gap-2 p-5 sm:aspect-video sm:p-8 lg:aspect-auto">
        <span className="arena-tab font-arena-title px-3 py-1 text-[11px] leading-none tracking-widest uppercase">
          Escolhendo · Arena
        </span>
        <h1 className="arena-name font-arena-title text-[clamp(2rem,9vw,4rem)] leading-[0.9] uppercase xl:text-7xl">
          {name ?? "Escolha uma arena"}
        </h1>
        {title ? (
          <p className="arena-name flex items-center gap-2 text-sm font-semibold sm:text-base">
            {random ? <Shuffle aria-hidden className="size-4" /> : null}
            {title}
          </p>
        ) : null}
      </div>

      <aside className="arena-picker-panel flex flex-col gap-6 p-5 sm:p-6">
        <ArenaMatchupSlots
          player={player}
          opponent={opponent}
          random={fighterRandom}
          active="player"
          onActivate={(side) => onBack(side)}
        />

        <ArenaPanelSection title="Arenas">
          <ul data-slot="arena-map-list" className="grid grid-cols-3 gap-2">
            {maps.map((item) => (
              <MapTile
                key={item.id}
                label={item.name}
                current={!random && item.id === map?.id}
                onClick={() => onChoose(item.id)}
              >
                <Image
                  src={item.background.path}
                  alt=""
                  fill
                  sizes="160px"
                  data-pixel={item.background.pixelArt ? "" : undefined}
                  className="arena-map-thumb object-cover transition-transform duration-300 group-hover:scale-110"
                />
              </MapTile>
            ))}
            <MapTile label={RANDOM_MAP.name} current={random} onClick={() => onChoose(RANDOM_MAP_ID)}>
              <span className="absolute inset-0 grid place-items-center">
                <Shuffle aria-hidden className="size-7 text-(--arena-ink-subtle)" />
              </span>
            </MapTile>
          </ul>
        </ArenaPanelSection>

        <ArenaPanelSection title="Detalhes" aria-live="polite">
          <p className="text-sm text-(--arena-ink-subtle)">{description}</p>
          {traits.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {traits.map((trait) => {
                const Icon = TRAIT_ICON[trait.tone];
                return (
                  <li
                    key={trait.label}
                    data-tone={trait.tone}
                    className="arena-map-trait flex items-center gap-1.5 px-2 py-1 text-xs font-semibold"
                  >
                    <Icon aria-hidden className="size-3.5" />
                    {trait.label}
                  </li>
                );
              })}
            </ul>
          ) : null}
        </ArenaPanelSection>

        <div className="mt-auto flex flex-col gap-4">
          <div className="arena-cta-shadow">
            <button
              type="button"
              onClick={onFight}
              disabled={!map && !random}
              className="arena-cta flex h-14 w-full items-center justify-center gap-3 font-arena-title text-2xl uppercase focus-visible:outline-none"
            >
              {tutorial ? <GraduationCap aria-hidden className="size-6" /> : <Swords aria-hidden className="size-6" />}
              {tutorial ? "Treinar" : "Lutar"}
            </button>
          </div>
          <ArenaActionButton variant="secondary" onClick={() => onBack()}>
            <ArrowLeft aria-hidden className="size-4" />
            Lutadores
          </ArenaActionButton>
        </div>
      </aside>
    </div>
  );
}

export { ArenaMapPicker };
