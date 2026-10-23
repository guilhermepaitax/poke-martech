import type { ArenaMap } from "@/lib/arena/map";

const arenaDaSelva: ArenaMap = {
  id: "arena-da-selva",
  name: "Arena da Selva",
  title: "Ruínas tomadas pelo mato",
  description:
    "Pátio de pedra antigo engolido pela floresta. Blocos de arenito espalhados servem de cobertura e quebram com os golpes.",
  traits: [
    { label: "Terreno aberto", tone: "neutral" },
    { label: "Blocos quebráveis", tone: "neutral" },
  ],
  background: { key: "arena-floor", path: "/arena/backgrounds/floor.jpg" },
  walkInset: { top: 150, right: 180, bottom: 220, left: 200 },
  obstacles: [
    { x: 0.3, y: 0.27, width: 220, height: 110, hp: 90 },
    { x: 0.68, y: 0.7, width: 110, height: 220, hp: 90 },
    { x: 0.5, y: 0.22, width: 140, height: 90, hp: 55 },
    { x: 0.2, y: 0.68, width: 90, height: 140, hp: 55 },
    { x: 0.55, y: 0.74, width: 140, height: 90, hp: 55 },
    { x: 0.42, y: 0.5, width: 72, height: 72, hp: 30 },
    { x: 0.8, y: 0.3, width: 72, height: 72, hp: 30 },
    { x: 0.62, y: 0.42, width: 64, height: 64, hp: 30 },
  ],
  obstacleTheme: "sandstone",
  terrain: [],
  blockedAreas: [],
};

export { arenaDaSelva };
