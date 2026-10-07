"use client";

import {
  resolveCardEffects,
  type CardEffectsInput,
} from "@/components/holo-card/card-effects";
import { CardHolo } from "@/components/holo-card/card-holo";
import { CardSurfaceContext } from "@/components/holo-card/card-surface";
import { useHoloTilt } from "@/components/holo-card/use-holo-tilt";
import { cn } from "@/lib/utils";
import type { Finish } from "@/lib/value-objects/card";
import Image from "next/image";
import { useMemo, type ComponentProps } from "react";
import { PACK_BODY_CLIP, PACK_CAP_CLIP } from "./pack-outline";

interface Booster3DProps extends ComponentProps<"div"> {
  name: string;
  imageUrl: string | null;
  finish: Finish;
  effects?: CardEffectsInput;
  ripping?: boolean;
}

function Booster3D({
  name,
  imageUrl,
  finish,
  effects: effectsInput = true,
  ripping = false,
  className,
  ...props
}: Booster3DProps) {
  const effects = resolveCardEffects(effectsInput);
  const surface = useMemo(() => ({ finish, effects }), [finish, effects]);
  const tiltRef = useHoloTilt({ enabled: effects.tilt });

  return (
    <div
      ref={tiltRef}
      data-slot="booster-pack"
      data-finish={finish}
      data-ripping={ripping ? "" : undefined}
      data-tilt={effects.tilt ? "" : undefined}
      data-holo={effects.holo ? "" : undefined}
      data-pop-out={effects.popOut ? "" : undefined}
      data-border-shine={effects.borderShine ? "" : undefined}
      className={cn("@container perspective-[1000px]", className)}
      {...props}
    >
      <div
        className={cn(
          "pack-body relative aspect-2/3 w-full",
          ripping
            ? "pack-rip"
            : effects.tilt
              ? "tilt-rotate"
              : "transition-transform duration-500",
        )}
      >
        <CardSurfaceContext value={surface}>
          <div
            data-finish={finish}
            className="pack-layer"
            style={{ clipPath: PACK_BODY_CLIP }}
          >
            <div className="pack-window">
              {imageUrl ? (
                <div className="pack-art">
                  <Image
                    src={imageUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="320px"
                  />
                </div>
              ) : (
                <div className="flex size-full items-center justify-center px-[10%] text-center text-[9cqw] font-semibold leading-tight text-foreground">
                  {name}
                </div>
              )}
              <CardHolo scope="portrait" />
            </div>
            <div aria-hidden className="pack-foil" />
            <div aria-hidden className="pack-seal" data-edge="bottom" />
            <div aria-hidden className="card-sheen" />
            <CardHolo scope="card" />
          </div>
          <div
            data-finish={finish}
            className="pack-layer pack-cap"
            style={{ clipPath: PACK_CAP_CLIP }}
          >
            <div aria-hidden className="pack-foil" />
            <div aria-hidden className="pack-seal" data-edge="top" />
            <div aria-hidden className="card-sheen" />
            <CardHolo scope="card" />
          </div>
        </CardSurfaceContext>
      </div>
    </div>
  );
}

export { Booster3D };
