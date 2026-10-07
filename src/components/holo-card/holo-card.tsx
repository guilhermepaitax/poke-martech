"use client";

import { energyStyle, TYPE_APPEARANCE } from "@/lib/type-appearance";
import { cn } from "@/lib/utils";
import type {
  CardFrame,
  EnergyType,
  Rarity,
  Stage,
} from "@/lib/value-objects/card";
import type { Attack, CardArtwork, CardEvolutionOrigin } from "@/types/catalog";
import { useMemo, type ComponentProps, type CSSProperties } from "react";
import { resolveCardEffects, type CardEffectsInput } from "./card-effects";
import { cardFinish } from "./card-finish";
import { CardSurfaceContext } from "./card-surface";
import type { HoloCardFaceProps } from "./holo-card.types";
import { CARD_LAYOUTS } from "./layouts/registry";
import { useHoloTilt } from "./use-holo-tilt";

interface HoloCardProps extends ComponentProps<"div">, Partial<CardArtwork> {
  name: string;
  imageUrl: string | null;
  rarity: Rarity;
  hp: number;
  energyType: EnergyType;
  frame?: CardFrame;
  stage?: Stage;
  evolvesFrom?: CardEvolutionOrigin | null;
  attacks?: Attack[];
  retreatCost?: number;
  weaknessType?: EnergyType | null;
  weaknessModifier?: number;
  flavorText?: string;
  revealed?: boolean;
  flourish?: boolean;
  effects?: CardEffectsInput;
}

function HoloCard({
  name,
  imageUrl,
  rarity,
  hp,
  energyType,
  frame = "basic",
  stage = "basic",
  evolvesFrom = null,
  attacks = [],
  retreatCost = 0,
  weaknessType = null,
  weaknessModifier = 0,
  flavorText = "",
  imageX = 50,
  imageY = 50,
  imageScale = 100,
  overlayImageUrl = null,
  overlayX = 50,
  overlayY = 50,
  overlayScale = 100,
  decorationAsset = null,
  decorationImageUrl = null,
  revealed = true,
  flourish = false,
  effects: effectsInput,
  className,
  ...props
}: HoloCardProps) {
  const style = energyStyle(energyType) as CSSProperties;
  const Face = CARD_LAYOUTS[frame];
  const effects = resolveCardEffects(effectsInput);
  const finish = cardFinish(rarity);
  const surface = useMemo(() => ({ finish, effects }), [finish, effects]);
  const tiltRef = useHoloTilt({ enabled: effects.tilt });
  const face: HoloCardFaceProps = {
    name,
    imageUrl,
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
    imageX,
    imageY,
    imageScale,
    overlayImageUrl,
    overlayX,
    overlayY,
    overlayScale,
    decorationAsset,
    decorationImageUrl,
  };

  return (
    <div
      ref={tiltRef}
      data-slot="holo-card"
      data-frame={frame}
      data-finish={finish}
      data-revealed={revealed ? "" : undefined}
      data-flourish={flourish ? "" : undefined}
      data-tilt={effects.tilt ? "" : undefined}
      data-holo={effects.holo ? "" : undefined}
      data-pop-out={effects.popOut ? "" : undefined}
      data-border-shine={effects.borderShine ? "" : undefined}
      className={cn("@container perspective-[1000px]", className)}
      {...props}
    >
      <div
        data-energy={energyType}
        data-text-outline={
          TYPE_APPEARANCE[energyType].textOutline ? "" : undefined
        }
        data-flourish={flourish && revealed ? "" : undefined}
        className={cn(
          "relative aspect-63/88 w-full rounded-[4%] transform-3d",
          effects.tilt ? "tilt-rotate" : "transition-transform duration-500",
        )}
        style={style}
      >
        <div className="absolute inset-0 overflow-hidden rounded-[4%] backface-hidden">
          <CardSurfaceContext value={surface}>
            <Face {...face} />
          </CardSurfaceContext>
        </div>
      </div>
    </div>
  );
}

export { HoloCard };
