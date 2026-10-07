import { resolveCardDecoration } from "@/lib/card-decorations";
import { cn } from "@/lib/utils";
import type { ComponentProps, CSSProperties } from "react";
import { useCardSurface } from "./card-surface";

interface CardDecorationProps extends ComponentProps<"div"> {
  decorationAsset: string | null;
  decorationImageUrl: string | null;
}

function CardDecoration({
  decorationAsset,
  decorationImageUrl,
  className,
  style,
  ...props
}: CardDecorationProps) {
  const { effects } = useCardSurface();
  const decoration = resolveCardDecoration(decorationAsset, decorationImageUrl);
  if (!decoration) return null;

  const layerStyle = {
    "--decoration-image": `url("${decoration.src}")`,
    "--decoration-bleed": `${decoration.bleed}%`,
    ...style,
  } as CSSProperties;

  return (
    <div
      data-slot="card-decoration"
      aria-hidden
      className={cn("card-decoration", className)}
      style={layerStyle}
      {...props}
    >
      <div className="card-decoration-art" />
      {effects.holo ? <div className="card-decoration-shimmer" /> : null}
    </div>
  );
}

export { CardDecoration };
