"use client";

import type { ArenaFighter } from "@/lib/arena/fighter";
import {
  TUTORIAL_LESSONS,
  TUTORIAL_STEPS,
  type TutorialStep,
} from "@/lib/arena/tutorial";
import { RotateCcw, SkipForward, Swords } from "lucide-react";
import type { ReactNode } from "react";

import { ArenaActionButton } from "./arena-action-button";
import { ArenaTitleCard } from "./arena-title-card";

type Lesson = Exclude<TutorialStep, "done">;

function Key({ children }: { children: ReactNode }) {
  return (
    <kbd className="arena-tutorial-key mx-0.5 inline-block px-1.5 py-0.5 font-sans text-[11px] font-bold leading-none">
      {children}
    </kbd>
  );
}

function lessonCopy(
  step: Lesson,
  fighter: ArenaFighter,
): { title: string; body: ReactNode } {
  switch (step) {
    case "move":
      return {
        title: "Mover",
        body: (
          <>
            Use <Key>W</Key>
            <Key>A</Key>
            <Key>S</Key>
            <Key>D</Key> ou as setas para andar pela arena.
          </>
        ),
      };
    case "aim":
      return {
        title: "Mirar",
        body: <>Mova o mouse: a seta mostra para onde seus golpes vão.</>,
      };
    case "melee":
      return {
        title: "Ataque 1",
        body: (
          <>
            Aperte <Key>1</Key> para selecionar o ataque{" "}
            <span className="font-bold">{fighter.attacks.melee.hudName}</span>,
            chegue perto do oponente e <Key>clique com mouse</Key> para
            acertá-lo.
          </>
        ),
      };
    case "fire":
      return {
        title: "Ataque 2",
        body: (
          <>
            Aperte <Key>2</Key> ou role o <Key>scroll do mouse</Key> para
            selecionar o ataque{" "}
            <span className="font-bold">{fighter.attacks.fire.hudName}</span>.
            Mire no boneco e <Key>clique com mouse</Key> para acertá-lo de
            longe.
          </>
        ),
      };
    case "charge":
      return {
        title: "Carregar",
        body: (
          <>
            <Key>Segure o clique</Key> até aparecer MÁXIMO e solte: o golpe
            causa bem mais dano. Carregando, você anda mais devagar.
          </>
        ),
      };
    case "dash":
      return {
        title: "Dash",
        body: (
          <>
            Aperte <Key>Espaço</Key> andando para dar um dash rápido. Use para
            desviar de golpes.
          </>
        ),
      };
    case "defend":
      return {
        title: "Defender",
        body: (
          <>
            <Key>Segure Shift</Key> para defender: você leva bem menos dano e
            não fica atordoado. O boneco vai atirar em você, defenda um golpe!
            Cada bloqueio gasta a barra de guarda; se ela quebrar, você fica
            atordoado.
          </>
        ),
      };
    case "pickup":
      return {
        title: "Caixas",
        body: (
          <>
            Caixas caem pela arena com bônus. A roxa é surpresa e pode ser
            armadilha. Pegue a caixa que apareceu!
          </>
        ),
      };
  }
}

function ArenaTutorial({
  step,
  fighter,
  onSkip,
  onFight,
  onRepeat,
  onExit,
}: {
  step: TutorialStep;
  fighter: ArenaFighter;
  onSkip: () => void;
  onFight: () => void;
  onRepeat: () => void;
  onExit: () => void;
}) {
  if (step === "done") {
    return (
      <div
        data-slot="arena-tutorial-done"
        role="dialog"
        aria-modal="true"
        aria-labelledby="arena-overlay-title"
        className="absolute inset-0 z-10"
      >
        <ArenaTitleCard
          title="Treino"
          accent="ok!"
          kicker="Esc pausa a partida · zere o HP do oponente"
          tone="victory"
          fighter={fighter}
        >
          <div className="arena-title-panel flex flex-col gap-3 p-4">
            <ArenaActionButton autoFocus onClick={onFight}>
              <Swords aria-hidden className="size-5" />
              Lutar agora
            </ArenaActionButton>
            <ArenaActionButton variant="secondary" onClick={onRepeat}>
              <RotateCcw aria-hidden className="size-4" />
              Repetir tutorial
            </ArenaActionButton>
            <ArenaActionButton variant="secondary" onClick={onExit}>
              Trocar lutadores
            </ArenaActionButton>
          </div>
        </ArenaTitleCard>
      </div>
    );
  }

  const index = TUTORIAL_STEPS.indexOf(step);
  const copy = lessonCopy(step, fighter);

  return (
    <div
      data-slot="arena-tutorial"
      className="pointer-events-none absolute inset-x-0 bottom-24 z-[6] flex justify-center px-4 sm:bottom-32"
    >
      <div
        key={step}
        role="status"
        aria-live="polite"
        className="arena-tutorial-card pointer-events-auto flex w-[min(26rem,100%)] flex-col gap-2.5 p-4"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="arena-tab px-3 py-1 font-arena-title text-[11px] leading-none tracking-widest uppercase">
            Tutorial · {index + 1}/{TUTORIAL_LESSONS}
          </span>
          <button
            type="button"
            onClick={onSkip}
            className="flex items-center gap-1 text-[11px] font-semibold tracking-wide text-(--arena-ink-subtle) uppercase hover:text-(--arena-ink) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--arena-cta)"
          >
            Pular
            <SkipForward aria-hidden className="size-3.5" />
          </button>
        </div>
        <h3 className="font-arena-title text-2xl leading-none uppercase">
          {copy.title}
        </h3>
        <p className="text-sm leading-relaxed text-(--arena-ink-subtle)">
          {copy.body}
        </p>
        <div aria-hidden className="flex gap-1">
          {Array.from({ length: TUTORIAL_LESSONS }, (_, dot) => (
            <span
              key={dot}
              data-state={
                dot < index ? "done" : dot === index ? "current" : undefined
              }
              className="arena-tutorial-dot h-1.5 flex-1"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export { ArenaTutorial };
