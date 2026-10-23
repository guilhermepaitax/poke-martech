import type { ChargeLevel } from "./charge";
import type { AttackKind } from "./combat";

type ArenaMode = "match" | "tutorial";

// O que a cena reporta ao jogador fazer algo durante o treino.
type TutorialAction =
  | { type: "move" }
  | { type: "aim" }
  | { type: "select"; kind: AttackKind }
  | { type: "attack"; kind: AttackKind; level: ChargeLevel }
  | { type: "hit"; kind: AttackKind }
  | { type: "dash" }
  | { type: "block" }
  | { type: "pickup" };

type TutorialStep =
  | "move"
  | "aim"
  | "melee"
  | "fire"
  | "charge"
  | "dash"
  | "defend"
  | "pickup"
  | "done";

const TUTORIAL_STEPS: readonly TutorialStep[] = [
  "move",
  "aim",
  "melee",
  "fire",
  "charge",
  "dash",
  "defend",
  "pickup",
  "done",
];

// Passos que o jogador executa; "done" é só a tela final.
const TUTORIAL_LESSONS = TUTORIAL_STEPS.length - 1;

function satisfies(step: TutorialStep, action: TutorialAction) {
  switch (step) {
    case "move":
      return action.type === "move";
    case "aim":
      return action.type === "aim";
    case "melee":
      return action.type === "hit" && action.kind === "melee";
    case "fire":
      return action.type === "hit" && action.kind === "fire";
    case "charge":
      return action.type === "attack" && action.level === 2;
    case "dash":
      return action.type === "dash";
    case "defend":
      return action.type === "block";
    case "pickup":
      return action.type === "pickup";
    case "done":
      return false;
  }
}

function advanceTutorial(step: TutorialStep, action: TutorialAction): TutorialStep {
  if (!satisfies(step, action)) return step;
  return TUTORIAL_STEPS[TUTORIAL_STEPS.indexOf(step) + 1] ?? "done";
}

function isArenaMode(value: unknown): value is ArenaMode {
  return value === "match" || value === "tutorial";
}

export { advanceTutorial, isArenaMode, TUTORIAL_LESSONS, TUTORIAL_STEPS };
export type { ArenaMode, TutorialAction, TutorialStep };
