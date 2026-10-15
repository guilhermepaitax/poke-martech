import { TradeBoard } from "@/components/trades/trade-board";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trocas",
};

export default function TradesPage() {
  return <TradeBoard />;
}
