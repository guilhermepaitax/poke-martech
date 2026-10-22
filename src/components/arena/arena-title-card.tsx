import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

type ArenaTitleTone = "victory" | "defeat" | "neutral" | "loading";

const CONFETTI = [
  { x: -220, y: -120, color: "var(--accent)", delay: 0, ms: 1600 },
  { x: 200, y: -140, color: "var(--energy-water)", delay: 120, ms: 1800 },
  { x: -160, y: 130, color: "white", delay: 260, ms: 1500 },
  { x: 240, y: 90, color: "var(--accent)", delay: 380, ms: 1700 },
  { x: -260, y: 20, color: "var(--energy-water)", delay: 520, ms: 1900 },
  { x: 120, y: 160, color: "white", delay: 640, ms: 1600 },
  { x: -80, y: -170, color: "var(--energy-psychic)", delay: 760, ms: 1800 },
  { x: 280, y: -40, color: "white", delay: 880, ms: 1500 },
  { x: -300, y: -60, color: "var(--accent)", delay: 1000, ms: 1700 },
  { x: 60, y: -190, color: "var(--energy-water)", delay: 1120, ms: 1900 },
  { x: -40, y: 180, color: "var(--energy-psychic)", delay: 1240, ms: 1600 },
  { x: 180, y: 150, color: "var(--accent)", delay: 1360, ms: 1800 },
] as const;

function ArenaTitleCard({
  title,
  accent,
  kicker,
  tone,
  confetti = tone === "victory",
  children,
  className,
}: {
  title: string;
  accent?: string;
  kicker?: string;
  tone: ArenaTitleTone;
  confetti?: boolean;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-slot="arena-title-card"
      data-tone={tone === "loading" ? "neutral" : tone}
      className={cn(
        "arena-title absolute inset-0 flex flex-col items-center justify-center gap-8 overflow-hidden p-4",
        className,
      )}
    >
      <div aria-hidden className="arena-title-backdrop absolute inset-0" />
      <div
        aria-hidden
        className="arena-title-rays absolute top-1/2 left-1/2 size-[220vmax] -translate-x-1/2 -translate-y-1/2"
      />
      <div className="relative flex flex-col items-center">
        <Star
          aria-hidden
          className="arena-title-star absolute -top-10 -left-14 size-28 sm:-left-20 sm:size-36"
          fill="currentColor"
          strokeWidth={0}
        />
        {confetti
          ? CONFETTI.map((piece, index) => (
              <span
                key={index}
                aria-hidden
                className="arena-title-confetti absolute top-1/2 left-1/2"
                style={
                  {
                    "--confetti": piece.color,
                    "--confetti-x": `${piece.x}px`,
                    "--confetti-y": `${piece.y}px`,
                    "--confetti-delay": `${piece.delay}ms`,
                    "--confetti-ms": `${piece.ms}ms`,
                  } as CSSProperties
                }
              />
            ))
          : null}
        {kicker ? (
          <span className="relative mb-2 font-arena-title text-sm tracking-widest text-background uppercase drop-shadow sm:text-base">
            {kicker}
          </span>
        ) : null}
        <h2
          id="arena-overlay-title"
          className="arena-title-ribbon relative px-8 py-2 sm:px-12 sm:py-3"
        >
          <span className="flex items-baseline gap-3 font-arena-title text-4xl leading-none uppercase sm:text-6xl">
            <span className="text-foreground">{title}</span>
            {accent ? <span className="arena-title-accent">{accent}</span> : null}
          </span>
        </h2>
      </div>
      {children ? <div className="relative w-[min(18rem,100%)]">{children}</div> : null}
    </div>
  );
}

export { ArenaTitleCard };
export type { ArenaTitleTone };
