import {
  FINISHES,
  RARITY_RANK,
  type Finish,
  type Rarity,
} from "@/lib/value-objects/card";

const CARD_FINISHES = FINISHES;

type CardFinish = Finish;

function cardFinish(rarity: Rarity): CardFinish {
  const rank = RARITY_RANK[rarity];
  if (rank <= RARITY_RANK.uncommon) return "matte";
  if (rank <= RARITY_RANK.double_rare) return "satin";
  if (rank <= RARITY_RANK.super_rare) return "mirror";
  return "prism";
}

export { CARD_FINISHES, cardFinish };
export type { CardFinish };
