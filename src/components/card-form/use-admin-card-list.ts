"use client";

import { useMemo, useState } from "react";
import { pokemonTypeName, usePokemonTypes } from "@/hooks/use-pokemon-types";
import { useAdminCards } from "@/hooks/use-admin";
import { paginate } from "@/lib/paginate";
import { RARITIES, RARITY_LABELS } from "@/lib/value-objects/card";
import {
  DEFAULT_ADMIN_CARD_FILTERS,
  filterAdminCards,
  formatAdminCardCount,
  hasActiveAdminCardFilters,
  isCardListStatus,
  parseEnergyTypeFilter,
  parseRarityFilter,
  type AdminCardFilterState,
} from "./filter-admin-cards";

function useAdminCardList() {
  const cards = useAdminCards();
  const types = usePokemonTypes();
  const [filters, setFilters] = useState<AdminCardFilterState>(DEFAULT_ADMIN_CARD_FILTERS);
  const catalog = useMemo(() => cards.data ?? [], [cards.data]);
  const filtered = useMemo(() => filterAdminCards(catalog, filters), [catalog, filters]);
  const filterKey = `${filters.name}\0${filters.status}\0${filters.energyType}\0${filters.rarity}`;
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 });
  const requestedPage = pageState.key === filterKey ? pageState.page : 1;
  const paged = useMemo(() => paginate(filtered, requestedPage), [filtered, requestedPage]);
  const typeOptions = useMemo(
    () => [
      { value: "all", label: "Todos os tipos" },
      ...catalog
        .map((card) => card.energyType)
        .filter((type, index, all) => all.indexOf(type) === index)
        .map((type) => ({ value: type, label: pokemonTypeName(types.data, type) }))
        .sort((a, b) => a.label.localeCompare(b.label, "pt-BR")),
    ],
    [catalog, types.data],
  );
  const rarityOptions = useMemo(
    () => [
      { value: "all", label: "Todas as raridades" },
      ...RARITIES.filter((rarity) => catalog.some((card) => card.rarity === rarity)).map(
        (rarity) => ({ value: rarity, label: RARITY_LABELS[rarity] }),
      ),
    ],
    [catalog],
  );

  function setName(name: string) {
    setFilters((current) => ({ ...current, name }));
  }

  function setStatus(value: string) {
    if (!isCardListStatus(value)) return;
    setFilters((current) => ({ ...current, status: value }));
  }

  function setEnergyType(value: string) {
    const energyType = parseEnergyTypeFilter(value);
    if (!energyType) return;
    setFilters((current) => ({ ...current, energyType }));
  }

  function setRarity(value: string) {
    const rarity = parseRarityFilter(value);
    if (!rarity) return;
    setFilters((current) => ({ ...current, rarity }));
  }

  function clearFilters() {
    setFilters(DEFAULT_ADMIN_CARD_FILTERS);
  }

  function setPage(page: number) {
    setPageState({ key: filterKey, page });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return {
    cards,
    types,
    filters,
    filtered,
    pageItems: paged.items,
    page: paged.page,
    pageCount: paged.pageCount,
    setPage,
    typeOptions,
    rarityOptions,
    hasActiveFilters: hasActiveAdminCardFilters(filters),
    countLabel: formatAdminCardCount(filtered.length, catalog.length),
    setName,
    setStatus,
    setEnergyType,
    setRarity,
    clearFilters,
  };
}

export { useAdminCardList };
