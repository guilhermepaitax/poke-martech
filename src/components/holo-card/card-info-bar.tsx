import type { ReactNode } from "react";

function CardInfoBar({ children }: { children: ReactNode }) {
  return (
    <div
      data-slot="card-info-bar"
      className="flex min-h-[1em] items-center justify-center rounded-[0.08em] px-[0.8em] py-[0.06em] shadow-[inset_0_-0.08em_0_var(--card-silver-dark),inset_0_0_0_1px_var(--card-silver-edge)]"
      style={{ background: "var(--card-silver-bar)" }}
    >
      <p className="max-w-full text-center text-[0.46em] leading-tight font-medium wrap-break-word text-(--card-ink)">
        {children}
      </p>
    </div>
  );
}

export { CardInfoBar };
