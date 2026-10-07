type CardEffects = {
  tilt: boolean;
  holo: boolean;
  popOut: boolean;
  borderShine: boolean;
};

type CardEffectsInput = boolean | Partial<CardEffects>;

const CARD_EFFECTS_OFF: CardEffects = {
  tilt: false,
  holo: false,
  popOut: false,
  borderShine: false,
};

const CARD_EFFECTS_ON: CardEffects = {
  tilt: true,
  holo: true,
  popOut: true,
  borderShine: true,
};

const DEFAULT_CARD_EFFECTS: CardEffectsInput = false;

function resolveCardEffects(
  value: CardEffectsInput = DEFAULT_CARD_EFFECTS,
): CardEffects {
  if (value === true) return CARD_EFFECTS_ON;
  if (value === false) return CARD_EFFECTS_OFF;
  return { ...CARD_EFFECTS_OFF, ...value };
}

function hasCardEffects(effects: CardEffects) {
  return Object.values(effects).some(Boolean);
}

export {
  CARD_EFFECTS_OFF,
  CARD_EFFECTS_ON,
  DEFAULT_CARD_EFFECTS,
  hasCardEffects,
  resolveCardEffects,
};
export type { CardEffects, CardEffectsInput };
