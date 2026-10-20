import type { EnergyType } from "@/lib/value-objects/card";
import type { PokedexSortKey } from "@/lib/value-objects/pokedex";
import { api } from "@/services/http";
import type {
  BoosterDetail,
  BoosterInput,
  BoosterSummary,
  CardDetail,
  CardGenerationDetail,
  CardGenerationInput,
  CardGenerationSummary,
  CardInput,
  CardOption,
  CardTag,
  AdminCatalogCard,
  PackOpening,
  PokedexPage,
  Profile,
  PublicPokedexPage,
  PublicProfile,
  PokemonType,
  RarityWeight,
} from "@/types/catalog";

function fetchProfile() {
  return api<Profile>("/api/me");
}

type PokedexQuery = {
  query: string;
  type: EnergyType | "all";
  sort: PokedexSortKey;
};

function pokedexSearch(filters: PokedexQuery, cursor: string | null) {
  const params = new URLSearchParams();
  if (filters.query.trim()) params.set("q", filters.query.trim());
  if (filters.type !== "all") params.set("tipo", filters.type);
  if (filters.sort !== "number") params.set("ordem", filters.sort);
  if (cursor) params.set("cursor", cursor);
  return params.toString();
}

function fetchPokedexPage(filters: PokedexQuery, cursor: string | null) {
  return api<PokedexPage>(`/api/pokedex/cards?${pokedexSearch(filters, cursor)}`);
}

function fetchProfileCards(username: string, filters: PokedexQuery, cursor: string | null) {
  return api<PublicPokedexPage>(
    `/api/profiles/${username}/cards?${pokedexSearch(filters, cursor)}`,
  );
}

function fetchPublicProfile(username: string) {
  return api<PublicProfile>(`/api/profiles/${username}`);
}

function fetchCard(id: string) {
  return api<CardDetail>(`/api/cards/${id}`);
}

function fetchBoosters() {
  return api<BoosterSummary[]>("/api/boosters");
}

function fetchBooster(slug: string) {
  return api<BoosterSummary>(`/api/boosters/${slug}`);
}

function openBooster(slug: string) {
  return api<PackOpening>(`/api/boosters/${slug}/open`, { method: "POST" });
}

function fetchOpening(id: string) {
  return api<PackOpening>(`/api/openings/${id}`);
}

function fetchAdminCards() {
  return api<AdminCatalogCard[]>("/api/admin/cards");
}

function searchAdminCards(name: string, excludeId: string | null) {
  const params = new URLSearchParams({ q: name });
  if (excludeId) params.set("exclude", excludeId);
  return api<CardOption[]>(`/api/admin/cards/search?${params}`);
}

function fetchAdminTags() {
  return api<CardTag[]>("/api/admin/tags");
}

function fetchAdminCard(id: string) {
  return api<CardDetail>(`/api/admin/cards/${id}`);
}

function createCard(input: CardInput) {
  return api<{ id: string }>("/api/admin/cards", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

function updateCard(id: string, input: CardInput) {
  return api<{ id: string }>(`/api/admin/cards/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

function fetchAdminBoosters() {
  return api<BoosterSummary[]>("/api/admin/boosters");
}

function fetchAdminBooster(id: string) {
  return api<BoosterDetail>(`/api/admin/boosters/${id}`);
}

function createBooster(input: BoosterInput) {
  return api<{ id: string }>("/api/admin/boosters", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

function updateBooster(id: string, input: BoosterInput) {
  return api<{ id: string }>(`/api/admin/boosters/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

function fetchCardGenerations() {
  return api<CardGenerationSummary[]>("/api/admin/card-generations");
}

function fetchCardGeneration(id: string) {
  return api<CardGenerationDetail>(`/api/admin/card-generations/${id}`);
}

function startCardGeneration(input: CardGenerationInput) {
  return api<{ id: string }>("/api/admin/card-generations", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

function retryCardGeneration(id: string) {
  return api<{ id: string }>(`/api/admin/card-generations/${id}/retry`, { method: "POST" });
}

function fetchPokemonTypes() {
  return api<PokemonType[]>("/api/types");
}

function fetchRarities() {
  return api<RarityWeight[]>("/api/admin/rarities");
}

function saveRarities(input: RarityWeight[]) {
  return api<RarityWeight[]>("/api/admin/rarities", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export {
  createBooster,
  createCard,
  fetchAdminBooster,
  fetchAdminBoosters,
  fetchAdminCard,
  fetchAdminCards,
  fetchAdminTags,
  fetchBooster,
  fetchBoosters,
  fetchCard,
  fetchCardGeneration,
  fetchCardGenerations,
  fetchOpening,
  fetchPokedexPage,
  fetchProfileCards,
  fetchPokemonTypes,
  fetchProfile,
  fetchPublicProfile,
  fetchRarities,
  openBooster,
  retryCardGeneration,
  saveRarities,
  searchAdminCards,
  startCardGeneration,
  updateBooster,
  updateCard,
};
export type { PokedexQuery };
