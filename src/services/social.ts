import { api } from "@/services/http";
import type { Page, ProfileLink, TradableCard, TradeProposalView } from "@/types/catalog";

function followUser(username: string) {
  return api<{ following: boolean }>(`/api/profiles/${username}/follow`, { method: "POST" });
}

function unfollowUser(username: string) {
  return api<{ following: boolean }>(`/api/profiles/${username}/follow`, { method: "DELETE" });
}

function withCursor(params: Record<string, string>, cursor: string | null) {
  const search = new URLSearchParams(params);
  if (cursor) search.set("cursor", cursor);
  return search.toString();
}

function fetchFollowers(username: string, cursor: string | null) {
  return api<Page<ProfileLink>>(`/api/profiles/${username}/followers?${withCursor({}, cursor)}`);
}

function fetchFollowing(username: string, cursor: string | null) {
  return api<Page<ProfileLink>>(`/api/profiles/${username}/following?${withCursor({}, cursor)}`);
}

function fetchTrades(box: "incoming" | "outgoing", cursor: string | null) {
  return api<Page<TradeProposalView>>(`/api/trades?${withCursor({ box }, cursor)}`);
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
