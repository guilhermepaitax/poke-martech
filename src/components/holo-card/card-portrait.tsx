import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { CardHolo } from "./card-holo";

function CardPortrait({
  imageUrl,
  imageX,
  imageY,
  imageScale,
  caption,
}: {
  imageUrl: string | null;
  imageX: number;
  imageY: number;
  imageScale: number;
  caption?: ReactNode;
}) {
  const imageStyle = {
    objectPosition: `${imageX}% ${imageY}%`,
    transform: `scale(${imageScale / 100})`,
  } as CSSProperties;

  return (
    <div
      data-slot="card-portrait"
      className="mx-[0.45em] flex shrink-0 flex-col gap-[0.16em] p-[0.16em] shadow-[0.08em_0.08em_0.12em_color-mix(in_srgb,var(--card-ink)_45%,transparent)]"
      style={{ background: "var(--card-silver-frame)" }}
    >
      <div className="relative aspect-17/10 overflow-hidden bg-muted shadow-[inset_0_0_0_1px_var(--card-silver-edge)]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            fill
            className="object-cover"
            style={imageStyle}
            sizes="280px"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-[0.7em] text-(--card-label)">
            Sem imagem
          </div>
        )}
        <CardHolo scope="portrait" />
      </div>
      {caption}
    </div>
  );
}

export { CardPortrait };
