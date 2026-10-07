const CARD_DECORATION_BLEED = 8;

const CARD_DECORATIONS = [
  {
    id: "flames",
    label: "Chamas",
    src: "/card-layers/ex/decoration-flames.svg",
  },
  {
    id: "droplets",
    label: "Gotas d'água",
    src: "/card-layers/ex/decoration-droplets.svg",
  },
  {
    id: "sparkles",
    label: "Brilhos",
    src: "/card-layers/ex/decoration-sparkles.svg",
  },
  {
    id: "bolts",
    label: "Raios",
    src: "/card-layers/ex/decoration-bolts.svg",
  },
] as const;

type CardDecorationId = (typeof CARD_DECORATIONS)[number]["id"];

const CARD_DECORATION_IDS = CARD_DECORATIONS.map((item) => item.id) as [
  CardDecorationId,
  ...CardDecorationId[],
];

function isCardDecorationId(value: string): value is CardDecorationId {
  return CARD_DECORATIONS.some((item) => item.id === value);
}

function cardDecorationSrc(id: string | null) {
  return CARD_DECORATIONS.find((item) => item.id === id)?.src ?? null;
}

function resolveCardDecoration(
  asset: string | null,
  imageUrl: string | null,
) {
  if (imageUrl) return { src: imageUrl, bleed: 0 };
  const src = cardDecorationSrc(asset);
  return src ? { src, bleed: CARD_DECORATION_BLEED } : null;
}

export {
  CARD_DECORATION_IDS,
  CARD_DECORATIONS,
  cardDecorationSrc,
  isCardDecorationId,
  resolveCardDecoration,
};
export type { CardDecorationId };
