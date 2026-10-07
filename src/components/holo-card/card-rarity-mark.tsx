import { RARITY_RANK, type Rarity } from "@/lib/value-objects/card";
import { useId } from "react";

function RarityDiamond({ gradientId }: { gradientId: string }) {
  return (
    <svg viewBox="0 0 12 16" className="h-[0.8em] w-[0.6em] shrink-0">
      <path
        d="M6 1 11 8 6 15 1 8Z"
        fill={`url(#${gradientId})`}
        stroke="var(--card-ink)"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <path
        d="M6 4 8.6 8 6 12 3.4 8Z"
        fill="none"
        stroke="var(--card-silver-dark)"
        strokeWidth="0.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CardRarityMark({ rarity }: { rarity: Rarity }) {
  const gradientId = useId();
  const count = RARITY_RANK[rarity] + 1;
  return (
    <span
      data-slot="card-rarity-mark"
      data-rarity={rarity}
      aria-hidden
      className="inline-flex shrink-0 items-center gap-[0.08em]"
    >
      <svg className="absolute size-0">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="var(--card-silver-light)" />
            <stop offset="0.5" stopColor="var(--card-silver-light)" />
            <stop offset="0.5" stopColor="var(--card-silver-dark)" />
            <stop offset="1" stopColor="var(--card-silver-dark)" />
          </linearGradient>
        </defs>
      </svg>
      {Array.from({ length: count }, (_, index) => (
        <RarityDiamond key={index} gradientId={gradientId} />
      ))}
    </span>
  );
}

export { CardRarityMark };
