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
  CardSummary,
  PackOpening,
  PokedexEntry,
  Profile,
  PublicProfile,
  PokemonType,
  RarityWeight,
} from "@/types/catalog";

function fetchProfile() {
  return api<Profile>("/api/me");
}

function fetchPokedex() {
  return api<PokedexEntry[]>("/api/pokedex");
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
  return api<BoosterDetail>(`/api/boosters/${slug}`);
}

function openBooster(slug: string) {
  return api<PackOpening>(`/api/boosters/${slug}/open`, { method: "POST" });
}

function fetchOpening(id: string) {
  return api<PackOpening>(`/api/openings/${id}`);
}

function fetchAdminCards() {
  return api<CardSummary[]>("/api/admin/cards");
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
  fetchBooster,
  fetchBoosters,
  fetchCard,
  fetchCardGeneration,
  fetchCardGenerations,
  fetchOpening,
  fetchPokedex,
  fetchPokemonTypes,
  fetchProfile,
  fetchPublicProfile,
  fetchRarities,
  openBooster,
  retryCardGeneration,
  saveRarities,
  startCardGeneration,
  updateBooster,
  updateCard,
};
