import { api } from "@/services/http";
import type { ProfileLink, TradableCard, TradeProposalView } from "@/types/catalog";

function followUser(username: string) {
  return api<{ following: boolean }>(`/api/profiles/${username}/follow`, { method: "POST" });
}

function unfollowUser(username: string) {
  return api<{ following: boolean }>(`/api/profiles/${username}/follow`, { method: "DELETE" });
}

function fetchFollowers(username: string) {
  return api<ProfileLink[]>(`/api/profiles/${username}/followers`);
}

function fetchFollowing(username: string) {
  return api<ProfileLink[]>(`/api/profiles/${username}/following`);
}

function fetchTrades(box: "incoming" | "outgoing") {
  return api<TradeProposalView[]>(`/api/trades?box=${box}`);
}

function fetchTradableCards() {
  return api<TradableCard[]>("/api/trades/offers");
}

function createTrade(input: { targetUsername: string; requestedCardId: string; offeredCardId: string }) {
  return api<{ id: string }>("/api/trades", { method: "POST", body: JSON.stringify(input) });
}

function acceptTrade(id: string) {
  return api<{ id: string }>(`/api/trades/${id}/accept`, { method: "POST" });
}

function rejectTrade(id: string) {
  return api<{ id: string }>(`/api/trades/${id}/reject`, { method: "POST" });
}

function cancelTrade(id: string) {
  return api<{ id: string }>(`/api/trades/${id}/cancel`, { method: "POST" });
}

export {
  acceptTrade,
  cancelTrade,
  createTrade,
  fetchFollowers,
  fetchFollowing,
  fetchTradableCards,
  fetchTrades,
  followUser,
  rejectTrade,
  unfollowUser,
};
