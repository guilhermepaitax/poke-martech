import type { CardFace } from "@/types/catalog";

type CardAttackSource = {
  damage: number | null;
  sortOrder: number;
};

type CardFighterSource = {
  id: string;
  name: string;
  hp: number;
  imageUrl: string | null;
  attacks: CardAttackSource[];
};

type ArenaFighter = {
  id: string;
  name: string;
  hp: number;
  imageUrl: string | null;
  attackDamage: number;
};

type ArenaMatchup = {
  player: ArenaFighter;
  opponent: ArenaFighter;
};

type ArenaRosterEntry = {
  id: string;
  fighter: ArenaFighter;
  face: CardFace;
};

type ArenaRoster = {
  fighters: ArenaRosterEntry[];
  playerId: string | null;
  opponentId: string | null;
};

function cardImageUrl(imageUrl: string | null) {
  if (!imageUrl) return null;
  const trimmed = imageUrl.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function cardToFighter(card: CardFighterSource): ArenaFighter {
  const attack = card.attacks
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .find((item) => typeof item.damage === "number");

  return {
    id: card.id,
    name: card.name,
    hp: Math.max(1, card.hp),
    imageUrl: cardImageUrl(card.imageUrl),
    attackDamage: attack?.damage ?? 0,
  };
}

export { cardToFighter };
export type {
  ArenaFighter,
  ArenaMatchup,
  ArenaRoster,
  ArenaRosterEntry,
  CardFighterSource,
};
