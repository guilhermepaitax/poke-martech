import { useMemo, useRef, useState } from "react";
import { landingCardFace } from "./landing-example-card";
import { LANDING_PIECE_IDS, type LandingPieceId } from "./landing.types";

function pulseCard(node: HTMLDivElement | null) {
  if (!node) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  node.animate(
    [
      { transform: "scale(0.98)" },
      { transform: "scale(1.02)" },
      { transform: "none" },
    ],
    { duration: 380, easing: "ease-out" },
  );
}

function useLandingCard() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [placed, setPlaced] = useState<LandingPieceId[]>([]);
  const face = useMemo(() => landingCardFace(placed), [placed]);

  function toggle(id: LandingPieceId) {
    setPlaced((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
    pulseCard(stageRef.current);
  }

  function mountAll() {
    setPlaced([...LANDING_PIECE_IDS]);
    pulseCard(stageRef.current);
  }

  function clear() {
    setPlaced([]);
    pulseCard(stageRef.current);
  }

  return {
    stageRef,
    placed,
    toggle,
    mountAll,
    clear,
    face,
    complete: placed.length === LANDING_PIECE_IDS.length,
    total: LANDING_PIECE_IDS.length,
  };
}

export { useLandingCard };
