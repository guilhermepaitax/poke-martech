import type { ArenaFighter } from "@/lib/arena/fighter";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

const ROTATION_ROW = 0;

function FighterSprite({
  fighter,
  size,
  className,
}: {
  fighter: ArenaFighter;
  size: number;
  className?: string;
}) {
  const sheet = fighter.sprite.sheets.idle;
  const style = {
    "--sprite-size": `${size}px`,
    "--sprite-columns": fighter.sprite.columns,
    "--sprite-row": ROTATION_ROW,
    backgroundImage: `url(${sheet.path})`,
  } as CSSProperties;

  return (
    <div
      data-slot="fighter-sprite"
      role="img"
      aria-label={fighter.name}
      className={cn("fighter-sprite shrink-0", className)}
      style={style}
    />
  );
}

export { FighterSprite };
