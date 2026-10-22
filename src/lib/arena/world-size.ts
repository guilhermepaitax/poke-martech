const WORLD_OVERFLOW = 1.5;

type ArenaWorldSize = {
  width: number;
  height: number;
};

function arenaWorldSize(
  viewWidth: number,
  viewHeight: number,
  imageWidth: number,
  imageHeight: number,
): ArenaWorldSize {
  if (viewWidth <= 0 || viewHeight <= 0 || imageWidth <= 0 || imageHeight <= 0) {
    return { width: 0, height: 0 };
  }

  const cover = Math.max(viewWidth / imageWidth, viewHeight / imageHeight);
  const scale = cover * WORLD_OVERFLOW;

  return {
    width: imageWidth * scale,
    height: imageHeight * scale,
  };
}

export { arenaWorldSize };
export type { ArenaWorldSize };
