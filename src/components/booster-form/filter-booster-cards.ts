import type { EnergyType } from "@/lib/value-objects/card";
import { cardMatchesTags, foldText } from "@/lib/value-objects/card-tag";
import type { BoosterCardInput } from "@/types/catalog";

type BoosterCatalogFilters = {
  name: string;
  energyTypes: EnergyType[];
  tags: string[];
};

type BoosterCatalogCard = {
  id: string;
  name: string;
  energyType: EnergyType;
  tags: string[];
};

function filterBoosterCatalog<T extends BoosterCatalogCard>(
  cards: T[],
  filters: BoosterCatalogFilters,
) {
  const name = foldText(filters.name);
  return cards.filter((card) => {
    if (name && !foldText(card.name).includes(name)) return false;
    if (
      filters.energyTypes.length > 0 &&
      !filters.energyTypes.includes(card.energyType)
    )
      return false;
    if (!cardMatchesTags(card.tags, filters.tags)) return false;
    return true;
  });
}

const BOOSTER_CARD_PAGE_SIZE = 20;

function formatBoosterSelection(
  selectedCount: number,
  visibleSelected: number,
  visibleCount: number,
  catalogCount: number,
) {
  const title = selectedCount === 1 ? "carta no pacote" : "cartas no pacote";
  const detail =
    selectedCount === 0
      ? "Nenhuma carta entrou no pacote."
      : visibleCount === catalogCount
        ? null
        : `${visibleSelected} das ${visibleCount} filtradas`;
  return { count: String(selectedCount), title, detail };
}

function allVisibleCardsSelected(
  selected: BoosterCardInput[],
  visibleIds: string[],
) {
  return (
    visibleIds.length > 0 &&
    visibleIds.every((id) => selected.some((item) => item.cardId === id))
  );
}

function selectVisibleCards(
  selected: BoosterCardInput[],
  visibleIds: string[],
) {
  const visible = new Set(visibleIds);
  if (allVisibleCardsSelected(selected, visibleIds)) {
    return selected.filter((item) => !visible.has(item.cardId));
  }
  const existing = new Set(selected.map((item) => item.cardId));
  return [
    ...selected,
    ...visibleIds
      .filter((id) => !existing.has(id))
      .map((cardId) => ({ cardId, weightOverride: null })),
  ];
}

export {
  allVisibleCardsSelected,
  BOOSTER_CARD_PAGE_SIZE,
  filterBoosterCatalog,
  formatBoosterSelection,
  selectVisibleCards,
};
export type { BoosterCatalogFilters };
