import type { FighterBanner } from "@/lib/arena/fighter";
import { cn } from "@/lib/utils";
import Image from "next/image";

function FighterPortrait({
  banner,
  className,
}: {
  banner: FighterBanner;
  className?: string;
}) {
  const { path, focus } = banner;

  return (
    <span data-slot="fighter-portrait" className={cn("relative overflow-hidden", className)}>
      <Image
        src={path}
        alt=""
        fill
        sizes="160px"
        className="scale-[2.4] object-cover"
        style={{ objectPosition: focus, transformOrigin: focus }}
      />
    </span>
  );
}

export { FighterPortrait };
