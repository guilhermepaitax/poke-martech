const TEETH = 18;
const TOOTH_DEPTH = 1.6;
const SEAL = 9;
const TEAR = 10.5;
const TEAR_JAG = [0, 0.5, -0.3, 0.6, -0.4, 0.2, -0.5, 0.4, -0.2, 0.5, -0.4, 0.3, 0];
const RIGHT_SIDE: [number, number][] = [
  [98.4, TEAR + 1.6],
  [99.3, 30],
  [99.7, 50],
  [99.3, 70],
  [98.4, 100 - SEAL - 1.6],
  [100, 100 - SEAL],
];

function point(x: number, y: number) {
  return `${Number(x.toFixed(2))}% ${Number(y.toFixed(2))}%`;
}

function teeth(edge: "top" | "bottom") {
  const points = Array.from({ length: TEETH * 2 + 1 }, (_, index) => {
    const x = (index / (TEETH * 2)) * 100;
    const inset = index % 2 === 0 ? TOOTH_DEPTH : 0;
    return point(x, edge === "top" ? inset : 100 - inset);
  });
  return edge === "top" ? points : points.reverse();
}

function tearLine() {
  return TEAR_JAG.map((jag, index) =>
    point((index / (TEAR_JAG.length - 1)) * 100, TEAR + jag),
  );
}

const PACK_CAP_CLIP = `polygon(${[...teeth("top"), ...tearLine().reverse()].join(", ")})`;

const PACK_BODY_CLIP = `polygon(${[
  ...tearLine(),
  ...RIGHT_SIDE.map(([x, y]) => point(x, y)),
  ...teeth("bottom"),
  ...RIGHT_SIDE.toReversed().map(([x, y]) => point(100 - x, y)),
].join(", ")})`;

export { PACK_BODY_CLIP, PACK_CAP_CLIP };
