import { useTypeName } from "@/hooks/use-pokemon-types";
import { CardAttackRow } from "../card-attack-row";
import { CardHeader } from "../card-header";
import { CardInfoBar } from "../card-info-bar";
import { CardPortrait } from "../card-portrait";
import { CardRarityMark } from "../card-rarity-mark";
import { CardShell } from "../card-shell";
import { CardStatBar } from "../card-stat-bar";
import type { HoloCardFaceProps } from "../holo-card.types";

function HoloCardBasic({
  name,
  imageUrl,
  imageX,
  imageY,
  imageScale,
  rarity,
  hp,
  energyType,
  stage,
  evolvesFrom,
  attacks,
  retreatCost,
  weaknessType,
  weaknessModifier,
  flavorText,
}: HoloCardFaceProps) {
  const typeName = useTypeName(energyType);
  return (
    <CardShell energyType={energyType}>
      <CardHeader
        stage={stage}
        name={name}
        hp={hp}
        energyType={energyType}
        evolvesFrom={evolvesFrom}
      />
      <CardPortrait
        imageUrl={imageUrl}
        imageX={imageX}
        imageY={imageY}
        imageScale={imageScale}
        caption={<CardInfoBar>{typeName}</CardInfoBar>}
      />
      <div className="flex min-h-0 flex-1 flex-col justify-center gap-[0.6em] px-[0.6em] py-[0.4em]">
        {attacks.map((attack) => (
          <CardAttackRow
            key={`${attack.sortOrder}-${attack.name}`}
            attack={attack}
          />
        ))}
      </div>
      <div className="px-[0.45em] py-[0.15em]">
        <CardStatBar
          weaknessType={weaknessType}
          weaknessModifier={weaknessModifier}
          retreatCost={retreatCost}
        />
      </div>
      <div className="flex items-end gap-[0.4em] px-[0.7em] pt-[0.2em] pb-[0.4em]">
        <CardRarityMark rarity={rarity} />
        {flavorText ? (
          <p className="min-w-0 flex-1 text-right text-[0.47em] leading-snug italic wrap-break-word text-(--card-label) tracking-tight">
            {flavorText}
          </p>
        ) : null}
      </div>
    </CardShell>
  );
}

export { HoloCardBasic };
