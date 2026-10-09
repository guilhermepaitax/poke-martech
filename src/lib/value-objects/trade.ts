const TRADE_STATUSES = ["pending", "accepted", "rejected", "cancelled"] as const;

type TradeStatus = (typeof TRADE_STATUSES)[number];

function isTradeStatus(value: string): value is TradeStatus {
  return (TRADE_STATUSES as readonly string[]).includes(value);
}

export { isTradeStatus, TRADE_STATUSES };
export type { TradeStatus };
