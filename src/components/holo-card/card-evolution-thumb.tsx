import Image from "next/image";
import type { CardEvolutionOrigin } from "@/types/catalog";

function CardEvolutionThumb({ origin }: { origin: CardEvolutionOrigin }) {
  return (
    <div
      data-slot="card-evolution-thumb"
      className="absolute top-[calc(100%+0.12em)] left-[0.1em] size-[2.3em] rounded-[0.4em] p-[0.1em] shadow-[0.06em_0.08em_0.14em_color-mix(in_srgb,var(--card-ink)_45%,transparent)]"
      style={{ background: "var(--card-silver-edge)" }}
    >
      <div
        className="relative size-full overflow-hidden rounded-[0.32em]"
        style={{ background: "var(--card-silver)" }}
      >
        {origin.imageUrl ? (
          <Image
            src={origin.imageUrl}
            alt={origin.name}
            fill
            className="object-cover"
            sizes="48px"
          />
        ) : null}
      </div>
    </div>
  );
}

export { CardEvolutionThumb };
