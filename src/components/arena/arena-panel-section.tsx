import { useId, type ReactNode } from "react";

function ArenaPanelSection({
  title,
  aside,
  children,
  "aria-live": ariaLive,
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
  "aria-live"?: "polite";
}) {
  const id = useId();

  return (
    <section
      data-slot="arena-panel-section"
      aria-labelledby={id}
      aria-live={ariaLive}
      className="flex flex-col gap-3"
    >
      <header className="flex items-end gap-3 border-b-2 border-(--picker-ink)">
        <h2
          id={id}
          className="arena-tab font-arena-title py-1 pr-6 pl-3 text-sm leading-none tracking-wide uppercase"
        >
          {title}_
        </h2>
        {aside ? (
          <span className="ml-auto pb-1 text-xs font-semibold text-(--picker-ink-subtle)">
            {aside}
          </span>
        ) : null}
      </header>
      {children}
    </section>
  );
}

export { ArenaPanelSection };
