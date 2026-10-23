import type { FighterBanner } from "@/lib/arena/fighter";

// Escolha "Aleatório": arte e cor próprias até o sorteio na hora da luta.
const RANDOM_FIGHTER = {
  name: "Aleatório",
  title: "Lutador surpresa, revelado na luta",
  color: "var(--energy-psychic)",
  banner: {
    path: "/arena/banners/random.webp",
    focus: "48.5% 48%",
  } satisfies FighterBanner,
  // Status ocultos: mesmo layout do painel de um lutador, valores só na luta.
  stats: {
    description:
      "Um lutador será sorteado quando a luta começar. HP e ataques dependem de quem cair.",
    hp: "??",
    // Preenchimento do medidor de HP, em % (só visual).
    meter: 100,
    attacks: {
      melee: { name: "Golpe 1", power: "??" },
      fire: { name: "Golpe 2", power: "??" },
    },
  },
} as const;

export { RANDOM_FIGHTER };
