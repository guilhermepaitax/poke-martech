import type { ArenaFighter } from "@/lib/arena/fighter";
import { cn } from "@/lib/utils";
import Image from "next/image";

import { RANDOM_FIGHTER } from "./random-fighter";

function FighterBanner({
  fighters,
  focused,
  random,
  className,
}: {
  fighters: readonly ArenaFighter[];
  focused: ArenaFighter | null;
  random: boolean;
  className?: string;
}) {
  return (
    <div
      data-slot="fighter-banner"
      aria-hidden
      className={cn("overflow-hidden", className)}
    >
      {fighters.map((fighter, index) => (
        <Image
          key={fighter.id}
          src={fighter.banner.path}
          alt=""
          fill
          priority={index === 0}
          sizes="(min-width: 1152px) 1152px, 100vw"
          data-hidden={!random && fighter.id === focused?.id ? undefined : ""}
          className="arena-banner object-cover object-[50%_center]"
        />
      ))}
      <Image
        src={RANDOM_FIGHTER.banner.path}
        alt=""
        fill
        sizes="(min-width: 1152px) 1152px, 100vw"
        data-hidden={random ? undefined : ""}
        className="arena-banner object-cover object-[30%_center]"
      />
      <div className="arena-banner-shade absolute inset-0" />
    </div>
  );
}

export { FighterBanner };
