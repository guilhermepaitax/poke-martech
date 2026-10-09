import type { TradableCard, TradeProposalView, TradeStatus } from "@/types/catalog";

type TradeRecord = {
  id: string;
  fromUserId: string;
  toUserId: string;
  offeredUserCardId: string;
  requestedUserCardId: string;
  status: TradeStatus;
};

type TradeUser = {
  id: string;
  username: string;
  name: string;
};

type NewTrade = {
  fromUserId: string;
  toUserId: string;
  offeredUserCardId: string;
  requestedUserCardId: string;
};

type ExchangeResult = "ok" | "missing" | "not-pending" | "ownership" | "reserved";

interface TradeRepository {
  findUserByUsername(username: string): Promise<TradeUser | null>;
  oldestFreeCopy(userId: string, cardId: string): Promise<{ id: string } | null>;
  insert(input: NewTrade): Promise<{ id: string } | null>;
  findById(id: string): Promise<TradeRecord | null>;
  list(userId: string, box: "incoming" | "outgoing"): Promise<TradeProposalView[]>;
  pendingIncoming(userId: string, limit: number): Promise<TradeProposalView[]>;
  listFreeOffers(userId: string): Promise<TradableCard[]>;
  exchange(id: string): Promise<ExchangeResult>;
  setStatus(id: string, status: "rejected" | "cancelled"): Promise<boolean>;
}

export type { ExchangeResult, NewTrade, TradeRecord, TradeRepository, TradeUser };
