import { BattleHub } from "@/components/battle-hub/battle-hub";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Batalha",
};

export default function BattlePage() {
  return <BattleHub />;
}
