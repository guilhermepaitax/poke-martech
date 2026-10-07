import { CardAttackRow } from "../card-attack-row";
import { CardCover } from "../card-cover";
import { CardDecoration } from "../card-decoration";
import { CardExMark } from "../card-ex-mark";
import { CardExRule } from "../card-ex-rule";
import { CardHeader } from "../card-header";
import { CardPortrait } from "../card-portrait";
import { CardRarityMark } from "../card-rarity-mark";
import { CardShell } from "../card-shell";
import { CardStatBar } from "../card-stat-bar";
import type { HoloCardFaceProps } from "../holo-card.types";

function HoloCardEx({
  name,
  imageUrl,
  imageX,
  imageY,
  imageScale,
  overlayImageUrl,
  overlayX,
  overlayY,
  overlayScale,
  decorationAsset,
  decorationImageUrl,
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
  return (
    <CardShell
      energyType={energyType}
      decoration={
        <CardDecoration
          decorationAsset={decorationAsset}
          decorationImageUrl={decorationImageUrl}
        />
      }
      cover={
        <CardCover
          overlayImageUrl={overlayImageUrl}
          overlayX={overlayX}
          overlayY={overlayY}
          overlayScale={overlayScale}
        />
      }
    >
      <CardHeader
        stage={stage}
        name={name}
        hp={hp}
        energyType={energyType}
        evolvesFrom={evolvesFrom}
        mark={<CardExMark />}
      />
      <CardPortrait
        imageUrl={imageUrl}
        imageX={imageX}
        imageY={imageY}
        imageScale={imageScale}
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
      <div className="flex items-end gap-[0.35em] px-[0.45em] pt-[0.15em] pb-[0.35em]">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-[0.15em]">
          <CardRarityMark rarity={rarity} />
        </div>
        <CardExRule />
      </div>
    </CardShell>
  );
}

export { HoloCardEx };
