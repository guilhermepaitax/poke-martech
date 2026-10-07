import { createContext, use } from "react";
import { CARD_EFFECTS_OFF, type CardEffects } from "./card-effects";
import type { CardFinish } from "./card-finish";

type CardSurface = {
  finish: CardFinish;
  effects: CardEffects;
};

const CardSurfaceContext = createContext<CardSurface>({
  finish: "matte",
  effects: CARD_EFFECTS_OFF,
});

function useCardSurface() {
  return use(CardSurfaceContext);
}

export { CardSurfaceContext, useCardSurface };
export type { CardSurface };
