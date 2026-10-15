"use client";

import { HoloCard } from "@/components/holo-card/holo-card";
import { Button } from "@/components/ui/button";
import { EnergyChip } from "@/components/ui/energy-chip";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { NullableStepper } from "@/components/ui/stepper";
import { TagFilter } from "@/components/ui/tag-filter";
import { paginate } from "@/lib/paginate";
import { cn } from "@/lib/utils";
import type { EnergyType } from "@/lib/value-objects/card";
import type { AdminCatalogCard, BoosterCardInput } from "@/types/catalog";
import { Check } from "lucide-react";
import { useState } from "react";
import {
  BOOSTER_CARD_PAGE_SIZE,
  formatBoosterSelection,
} from "./filter-booster-cards";

interface BoosterCardPickerProps {
  catalogCount: number;
  cards: AdminCatalogCard[];
  selected: BoosterCardInput[];
  selectedCount: number;
  query: string;
  energyTypes: EnergyType[];
  tags: string[];
  typeOptions: EnergyType[];
  tagOptions: string[];
  allVisibleSelected: boolean;
  onQueryChange: (value: string) => void;
  onToggleEnergy: (energy: EnergyType) => void;
  onToggleTag: (tag: string) => void;
  onToggleCard: (cardId: string) => void;
  onSelectVisible: () => void;
  onClearCards: () => void;
  onWeightChange: (cardId: string, weight: number | null) => void;
}

function BoosterCardPicker({
  catalogCount,
  cards,
  selected,
  selectedCount,
  query,
  energyTypes,
  tags,
  typeOptions,
  tagOptions,
  allVisibleSelected,
  onQueryChange,
  onToggleEnergy,
  onToggleTag,
  onToggleCard,
  onSelectVisible,
  onClearCards,
  onWeightChange,
}: BoosterCardPickerProps) {
  const filterKey = `${query}|${energyTypes.join(",")}|${tags.join(",")}`;
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 });
  if (pageState.key !== filterKey) {
    setPageState({ key: filterKey, page: 1 });
  }
  const page = pageState.key === filterKey ? pageState.page : 1;
  const paged = paginate(cards, page, BOOSTER_CARD_PAGE_SIZE);
  const visibleSelected = cards.filter((card) =>
    selected.some((item) => item.cardId === card.id),
  ).length;
  const selection = formatBoosterSelection(
    selectedCount,
    visibleSelected,
    cards.length,
    catalogCount,
  );
  const filtered = cards.length !== catalogCount;

  return (
    <div data-slot="booster-card-picker" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold">Cartas possíveis</p>
        <div className="flex items-center gap-3 rounded-2xl bg-white/55 px-3 py-2">
          <span className="text-2xl font-semibold tabular-nums leading-none">
            {selection.count}
          </span>
          <span className="text-sm leading-tight text-foreground-subtle">
            {selection.title}
            {selection.detail ? (
              <span className="block">{selection.detail}</span>
            ) : null}
          </span>
        </div>
      </div>
      <Input
        aria-label="Buscar carta"
        placeholder="Buscar carta"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />
      {typeOptions.length ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-foreground-subtle">Tipos</p>
          <div className="flex flex-wrap gap-2">
            {typeOptions.map((energy) => (
              <EnergyChip
                key={energy}
                energy={energy}
                selected={energyTypes.includes(energy)}
                onClick={() => onToggleEnergy(energy)}
              />
            ))}
          </div>
        </div>
      ) : null}
      {tagOptions.length ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-foreground-subtle">Tags</p>
          <TagFilter
            tags={tagOptions}
            selected={tags}
            onToggle={onToggleTag}
            ariaLabel="Tags das cartas"
          />
        </div>
      ) : null}
      {catalogCount === 0 ? (
        <p className="text-sm text-foreground-subtle">
          Cadastre cartas antes do pacote.
        </p>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-foreground-subtle">
            {cards.length} {cards.length === 1 ? "visível" : "visíveis"}
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClearCards}
              disabled={selectedCount === 0}
            >
              Remover todas
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onSelectVisible}
              disabled={cards.length === 0}
            >
              {allVisibleSelected
                ? filtered
                  ? "Desmarcar filtradas"
                  : "Desmarcar todas"
                : filtered
                  ? "Selecionar filtradas"
                  : "Selecionar todas"}
            </Button>
          </div>
        </div>
      )}
      {catalogCount > 0 && cards.length === 0 ? (
        <p className="text-sm text-foreground-subtle">
          Nenhuma carta com esses filtros.
        </p>
      ) : null}
      <ul className="grid grid-cols-5 gap-2">
        {paged.items.map((card) => {
          const current = selected.find((item) => item.cardId === card.id);
          const isSelected = Boolean(current);
          return (
            <li
              key={card.id}
              data-selected={isSelected ? "" : undefined}
              className={cn(
                "flex flex-col gap-2 rounded-[4%]",
                isSelected && "ring-2 ring-primary",
              )}
            >
              <button
                type="button"
                aria-pressed={isSelected}
                aria-label={
                  isSelected
                    ? `Remover ${card.name}`
                    : `Selecionar ${card.name}`
                }
                onClick={() => onToggleCard(card.id)}
                className="relative rounded-[4%] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <HoloCard
                  effects={false}
                  name={card.name}
                  imageUrl={card.imageUrl}
                  rarity={card.rarity}
                  hp={card.hp}
                  energyType={card.energyType}
                  frame={card.frame}
                  stage={card.stage}
                  evolvesFrom={card.evolvesFrom}
                  attacks={card.attacks}
                  retreatCost={card.retreatCost}
                  weaknessType={card.weaknessType}
                  weaknessModifier={card.weaknessModifier}
                  flavorText={card.flavorText}
                  imageX={card.imageX}
                  imageY={card.imageY}
                  imageScale={card.imageScale}
                  overlayImageUrl={card.overlayImageUrl}
                  overlayX={card.overlayX}
                  overlayY={card.overlayY}
                  overlayScale={card.overlayScale}
                  decorationAsset={card.decorationAsset}
                  decorationImageUrl={card.decorationImageUrl}
                />
                {isSelected ? (
                  <span className="absolute top-1 right-1 z-10 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3" />
                  </span>
                ) : null}
              </button>
              {current ? (
                <NullableStepper
                  ariaLabel={`Peso de ${card.name}`}
                  value={current.weightOverride}
                  min={1}
                  max={100}
                  emptyLabel="Auto"
                  onValueChange={(weightOverride) =>
                    onWeightChange(card.id, weightOverride)
                  }
                  className="w-full justify-between [&_button]:size-6 [&_span]:min-w-0 [&_span]:px-0.5 [&_span]:text-xs"
                />
              ) : null}
            </li>
          );
        })}
      </ul>
      <Pagination
        page={paged.page}
        pageCount={paged.pageCount}
        onPageChange={(nextPage) =>
          setPageState({ key: filterKey, page: nextPage })
        }
      />
    </div>
  );
}

export { BoosterCardPicker };
