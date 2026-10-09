import { cn } from "@/lib/utils";

function SleeveCard({
  className,
  plate,
}: {
  className: string;
  plate: "grass" | "water" | "lightning";
}) {
  return (
    <div
      className={cn(
        "absolute flex h-40 w-28 flex-col rounded-[1.35rem] border border-white/80 p-1.5 shadow-sm sm:h-56 sm:w-40",
        className,
      )}
      style={{ background: "var(--card-frame-satin)" }}
    >
      <div className="flex min-h-0 flex-1 flex-col rounded-[1.05rem] bg-card p-3">
        <span
          className="h-1.5 w-12 rounded-full"
          style={{ background: `var(--card-plate-${plate})` }}
        />
        <span className="mt-3 h-20 rounded-xl bg-muted" />
        <span className="mt-auto h-2 w-16 rounded-full bg-border" />
      </div>
    </div>
  );
}

function AuthSleeve() {
  return (
    <div
      data-slot="auth-sleeve"
      aria-hidden
      className="relative mx-auto h-44 w-48 sm:h-64 sm:w-72 lg:mx-0"
    >
      <SleeveCard
        plate="water"
        className="top-5 left-0 -rotate-12 opacity-80 sm:top-8"
      />
      <SleeveCard
        plate="lightning"
        className="top-2 left-7 rotate-6 opacity-90 sm:top-4 sm:left-10"
      />
      <SleeveCard plate="grass" className="top-0 left-14 sm:left-20" />
    </div>
  );
}

export { AuthSleeve };
