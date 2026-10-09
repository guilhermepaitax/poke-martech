import { cardTexturePath } from "@/lib/type-appearance";
import type { EnergyType } from "@/lib/value-objects/card";
import type { ReactNode } from "react";
import { CardHolo } from "./card-holo";
import { useCardSurface } from "./card-surface";

function CardShell({
  energyType,
  decoration,
  cover,
  children,
}: {
  energyType: EnergyType;
  decoration?: ReactNode;
  cover?: ReactNode;
  children: ReactNode;
}) {
  const { finish } = useCardSurface();
  return (
    <div
      data-slot="card-shell"
      data-finish={finish}
      className="absolute inset-0 flex flex-col overflow-hidden rounded-[4%] p-[3.5%] text-[4.5cqw] backface-hidden"
      style={{ background: `var(--card-frame-${finish})` }}
    >
      <div aria-hidden className="card-sheen" />
      <div
        className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[4%] bg-cover bg-center shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--card-ink)_18%,transparent)]"
        style={{ backgroundImage: `url(${cardTexturePath(energyType)})` }}
      >
        {children}
      </div>
      <CardHolo scope="card" />
      {cover}
      {decoration}
    </div>
  );
}

export { CardShell };
