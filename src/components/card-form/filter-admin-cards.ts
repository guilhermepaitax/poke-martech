import { hrefWithQuery } from "@/lib/search-href";
import { isEnergyType, isRarity, type EnergyType, type Rarity } from "@/lib/value-objects/card";
import type { CardSummary } from "@/types/catalog";

const CARD_LIST_STATUSES = ["all", "draft", "published"] as const;

type CardListStatus = (typeof CARD_LIST_STATUSES)[number];

type AdminCardFilterState = {
  name: string;
  status: CardListStatus;
  energyType: "all" | EnergyType;
  rarity: "all" | Rarity;
};

const DEFAULT_ADMIN_CARD_FILTERS: AdminCardFilterState = {
  name: "",
  status: "all",
  energyType: "all",
  rarity: "all",
};

function isCardListStatus(value: string): value is CardListStatus {
  return CARD_LIST_STATUSES.some((status) => status === value);
}

function fold(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

function filterAdminCards(cards: CardSummary[], filters: AdminCardFilterState) {
  const name = fold(filters.name);
  return cards.filter((card) => {
    if (name && !fold(card.name).includes(name)) return false;
    if (filters.status === "draft" && card.published) return false;
    if (filters.status === "published" && !card.published) return false;
    if (filters.energyType !== "all" && card.energyType !== filters.energyType) return false;
    if (filters.rarity !== "all" && card.rarity !== filters.rarity) return false;
    return true;
  });
}

function hasActiveAdminCardFilters(filters: AdminCardFilterState) {
  return (
    fold(filters.name).length > 0 ||
    filters.status !== "all" ||
    filters.energyType !== "all" ||
    filters.rarity !== "all"
  );
}

function formatAdminCardCount(shown: number, total: number) {
  const noun = total === 1 ? "carta" : "cartas";
  if (shown === total) return `${shown} ${noun}`;
  return `${shown} de ${total} ${noun}`;
}

function parseEnergyTypeFilter(value: string): AdminCardFilterState["energyType"] | null {
  if (value === "all") return "all";
  return isEnergyType(value) ? value : null;
}

function parseRarityFilter(value: string): AdminCardFilterState["rarity"] | null {
  if (value === "all") return "all";
  return isRarity(value) ? value : null;
}

function parsePage(value: string | null) {
  if (!value) return 1;
  const page = Number(value);
  if (!Number.isInteger(page) || page < 1) return 1;
  return page;
}

function adminCardFiltersFromSearch(params: URLSearchParams) {
  const status = params.get("status");
  const energyType = parseEnergyTypeFilter(params.get("tipo") ?? "all");
  const rarity = parseRarityFilter(params.get("raridade") ?? "all");
  return {
    filters: {
      name: params.get("q") ?? "",
      status: status && isCardListStatus(status) ? status : "all",
      energyType: energyType ?? "all",
      rarity: rarity ?? "all",
    } satisfies AdminCardFilterState,
    page: parsePage(params.get("pagina")),
  };
}

function adminCardListHref(
  pathname: string,
  current: URLSearchParams,
  filters: AdminCardFilterState,
  page: number,
) {
  return hrefWithQuery(pathname, current, {
    q: filters.name || null,
    status: filters.status === "all" ? null : filters.status,
    tipo: filters.energyType === "all" ? null : filters.energyType,
    raridade: filters.rarity === "all" ? null : filters.rarity,
    pagina: page > 1 ? String(page) : null,
  });
}

export {
  adminCardFiltersFromSearch,
  adminCardListHref,
  DEFAULT_ADMIN_CARD_FILTERS,
  filterAdminCards,
  formatAdminCardCount,
  hasActiveAdminCardFilters,
  isCardListStatus,
  parseEnergyTypeFilter,
  parseRarityFilter,
};
export type { AdminCardFilterState, CardListStatus };
