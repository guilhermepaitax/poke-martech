import type { BattleAction } from "@/lib/battle/battle-action";
import { api } from "@/services/http";
import type {
  ActiveBattleSummary,
  BattleActionResult,
  BattleDeckDetail,
  BattleDeckInput,
  BattleDeckSummary,
  BattleOpponentDetail,
  BattleOpponentInput,
  BattleOpponentSummary,
  BattleView,
} from "@/types/battle";

function fetchBattleHub() {
  return api<{ active: ActiveBattleSummary | null; opponents: BattleOpponentSummary[] }>("/api/battles");
}

function fetchDecks() {
  return api<BattleDeckSummary[]>("/api/battle/decks");
}

function fetchDeck(id: string) {
  return api<BattleDeckDetail>(`/api/battle/decks/${id}`);
}

function createDeck(input: BattleDeckInput) {
  return api<{ id: string }>("/api/battle/decks", { method: "POST", body: JSON.stringify(input) });
}

function updateDeck(id: string, input: BattleDeckInput) {
  return api<{ id: string }>(`/api/battle/decks/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

function deleteDeck(id: string) {
  return api<{ ok: true }>(`/api/battle/decks/${id}`, { method: "DELETE" });
}

function startBattle(input: { deckId: string; opponentId: string }) {
  return api<BattleActionResult>("/api/battles", { method: "POST", body: JSON.stringify(input) });
}

function fetchBattle(id: string) {
  return api<BattleView>(`/api/battles/${id}`);
}

function submitBattleAction(id: string, input: { version: number; action: BattleAction }) {
  return api<BattleActionResult>(`/api/battles/${id}/actions`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

function forfeitBattle(id: string, version: number) {
  return api<BattleView>(`/api/battles/${id}/forfeit`, {
    method: "POST",
    body: JSON.stringify({ version }),
  });
}

function fetchAdminOpponents() {
  return api<BattleOpponentSummary[]>("/api/admin/battle-opponents");
}

function fetchAdminOpponent(id: string) {
  return api<BattleOpponentDetail>(`/api/admin/battle-opponents/${id}`);
}

function createOpponent(input: BattleOpponentInput) {
  return api<{ id: string }>("/api/admin/battle-opponents", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

function updateOpponent(id: string, input: BattleOpponentInput) {
  return api<{ id: string }>(`/api/admin/battle-opponents/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export {
  createDeck,
  createOpponent,
  deleteDeck,
  fetchAdminOpponent,
  fetchAdminOpponents,
  fetchBattle,
  fetchBattleHub,
  fetchDeck,
  fetchDecks,
  forfeitBattle,
  startBattle,
  submitBattleAction,
  updateDeck,
  updateOpponent,
};
