import { STAGE_LABELS, type Stage } from "@/lib/value-objects/card";

const TAB_SHAPE = "polygon(0 0, 100% 0, 88% 100%, 0 100%)";

function CardStagePill({ stage }: { stage: Stage }) {
  const [word, level] = STAGE_LABELS[stage].split(" ");
  return (
    <div
      data-slot="card-stage-pill"
      className="shrink-0 rounded-l-[0.45em] p-[0.07em] shadow-sm"
      style={{ background: "var(--card-silver-edge)", clipPath: TAB_SHAPE }}
    >
      <div
        className="flex items-baseline gap-[0.12em] rounded-l-[0.4em] py-[0.2em] pr-[1.2em] pl-[0.6em] shadow-[inset_0_0.06em_0_var(--card-paper),inset_0_-0.08em_0_var(--card-silver-dark)]"
        style={{ background: "var(--card-silver)", clipPath: TAB_SHAPE }}
      >
        <span className="text-[0.62em] leading-none font-bold tracking-[0.04em] text-(--card-label) uppercase italic">
          {word}
        </span>
        {level ? (
          <span className="text-[0.9em] leading-none font-bold text-(--card-label) italic">
            {level}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export { CardStagePill };
