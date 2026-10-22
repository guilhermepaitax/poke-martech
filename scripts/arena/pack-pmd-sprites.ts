// Converte sprites no formato do PMD Sprite Collab (AnimData.xml + *-Anim.png +
// *-Shadow.png) para as folhas da arena: célula quadrada única, linha 0 com a
// rotação (frame 0 do idle nas 8 direções) e linhas 1–8 com as direções.
//
// Uso:
//   pnpm tsx scripts/arena/pack-pmd-sprites.ts <origem> <destino> idle=Idle walk=Walk ...
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import sharp, { type OverlayOptions } from "sharp";

type AnimInfo = {
  name: string;
  frameWidth: number;
  frameHeight: number;
  frames: number;
};

type Pixels = {
  data: Buffer;
  width: number;
  height: number;
};

type Frame = {
  // Recorte opaco do frame, em coordenadas relativas à âncora (pés).
  left: number;
  top: number;
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
  sourceX: number;
  sourceY: number;
};

const DIRECTIONS = 8;
const ALPHA_MIN = 1;
// Branco na folha de sombra marca o ponto central (pés) de cada frame.
const ANCHOR_COLOR = [255, 255, 255];

function tag(xml: string, name: string) {
  const match = xml.match(new RegExp(`<${name}>([^<]*)</${name}>`));
  return match?.[1]?.trim() ?? null;
}

function parseAnimData(xml: string) {
  const blocks = [...xml.matchAll(/<Anim>([\s\S]*?)<\/Anim>/g)].map((match) => match[1] ?? "");
  const byName = new Map<string, string>();
  blocks.forEach((block) => {
    const name = tag(block, "Name");
    if (name) byName.set(name, block);
  });
  const resolve = (name: string, depth = 0): AnimInfo => {
    const block = byName.get(name);
    if (!block) throw new Error(`Animação ${name} não está no AnimData.xml`);
    const copy = tag(block, "CopyOf");
    if (copy && depth < 4) return { ...resolve(copy, depth + 1), name };
    return {
      name,
      frameWidth: Number(tag(block, "FrameWidth")),
      frameHeight: Number(tag(block, "FrameHeight")),
      frames: block.match(/<Duration>/g)?.length ?? 0,
    };
  };
  return resolve;
}

async function loadPixels(file: string): Promise<Pixels> {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

function alphaAt(pixels: Pixels, x: number, y: number) {
  return pixels.data[(y * pixels.width + x) * 4 + 3] ?? 0;
}

function isAnchor(pixels: Pixels, x: number, y: number) {
  const index = (y * pixels.width + x) * 4;
  return (
    alphaAt(pixels, x, y) > 0 &&
    ANCHOR_COLOR.every((value, channel) => pixels.data[index + channel] === value)
  );
}

function readFrame(anim: AnimInfo, sprite: Pixels, shadow: Pixels, column: number, row: number): Frame {
  const sourceX = column * anim.frameWidth;
  const sourceY = row * anim.frameHeight;
  let anchorX = anim.frameWidth / 2;
  let anchorY = anim.frameHeight / 2;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let y = 0; y < anim.frameHeight; y += 1) {
    for (let x = 0; x < anim.frameWidth; x += 1) {
      if (isAnchor(shadow, sourceX + x, sourceY + y)) {
        anchorX = x;
        anchorY = y;
      }
      if (alphaAt(sprite, sourceX + x, sourceY + y) < ALPHA_MIN) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < minX) {
    return { left: 0, top: 0, width: 0, height: 0, anchorX, anchorY, sourceX, sourceY };
  }
  return {
    left: minX - anchorX,
    top: minY - anchorY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    anchorX,
    anchorY,
    sourceX,
    sourceY,
  };
}

async function readAnim(source: string, anim: AnimInfo) {
  const sprite = await loadPixels(path.join(source, `${anim.name}-Anim.png`));
  const shadow = await loadPixels(path.join(source, `${anim.name}-Shadow.png`));
  const rows: Frame[][] = [];
  for (let row = 0; row < DIRECTIONS; row += 1) {
    const frames: Frame[] = [];
    for (let column = 0; column < anim.frames; column += 1) {
      frames.push(readFrame(anim, sprite, shadow, column, row));
    }
    rows.push(frames);
  }
  return { anim, file: path.join(source, `${anim.name}-Anim.png`), rows };
}

type LoadedAnim = Awaited<ReturnType<typeof readAnim>>;

function cellLayout(anims: LoadedAnim[]) {
  let halfWidth = 0;
  let up = 0;
  let down = 0;
  anims.forEach(({ rows }) =>
    rows.flat().forEach((frame) => {
      if (frame.width === 0) return;
      halfWidth = Math.max(halfWidth, -frame.left, frame.left + frame.width);
      up = Math.max(up, -frame.top);
      down = Math.max(down, frame.top + frame.height);
    }),
  );
  const size = Math.ceil(Math.max(halfWidth * 2, up + down) / 2) * 2;
  // Âncora no centro horizontal; na vertical, centraliza a altura ocupada.
  const anchorX = size / 2;
  const anchorY = Math.round((size - (up + down)) / 2 + up);
  return { size, anchorX, anchorY };
}

async function writeSheet(
  out: string,
  anim: LoadedAnim,
  layout: ReturnType<typeof cellLayout>,
  columns: number,
  rotation: LoadedAnim,
) {
  // sharp não recorta dentro do overlay, então cada frame vira um buffer.
  const buffers: OverlayOptions[] = [];
  const crop = async (source: LoadedAnim, frame: Frame, column: number, row: number) => {
    if (frame.width === 0) return;
    const input = await sharp(source.file)
      .extract({
        left: frame.sourceX + frame.anchorX + frame.left,
        top: frame.sourceY + frame.anchorY + frame.top,
        width: frame.width,
        height: frame.height,
      })
      .png()
      .toBuffer();
    buffers.push({
      input,
      left: column * layout.size + layout.anchorX + frame.left,
      top: row * layout.size + layout.anchorY + frame.top,
    });
  };
  for (let direction = 0; direction < DIRECTIONS; direction += 1) {
    const first = rotation.rows[direction]?.[0];
    if (first) await crop(rotation, first, direction, 0);
    const frames = anim.rows[direction] ?? [];
    for (let column = 0; column < frames.length; column += 1) {
      const frame = frames[column];
      if (frame) await crop(anim, frame, column, direction + 1);
    }
  }
  await sharp({
    create: {
      width: columns * layout.size,
      height: (DIRECTIONS + 1) * layout.size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(buffers)
    .png()
    .toFile(out);
}

async function main() {
  const [source, target, ...pairs] = process.argv.slice(2);
  if (!source || !target || pairs.length === 0) {
    throw new Error("Uso: pack-pmd-sprites <origem> <destino> acao=Animacao ...");
  }
  const resolve = parseAnimData(await readFile(path.join(source, "AnimData.xml"), "utf8"));
  const mapping = pairs.map((pair) => {
    const [action, name] = pair.split("=");
    if (!action || !name) throw new Error(`Par inválido: ${pair}`);
    return { action, anim: resolve(name) };
  });
  const loaded = await Promise.all(mapping.map(({ anim }) => readAnim(source, anim)));
  const rotation = loaded[mapping.findIndex(({ action }) => action === "idle")] ?? loaded[0];
  if (!rotation) throw new Error("Nenhuma animação informada");
  const layout = cellLayout(loaded);
  const columns = Math.max(DIRECTIONS, ...loaded.map(({ anim }) => anim.frames));
  await mkdir(target, { recursive: true });
  for (let index = 0; index < mapping.length; index += 1) {
    const entry = mapping[index];
    const anim = loaded[index];
    if (!entry || !anim) continue;
    await writeSheet(path.join(target, `${entry.action}.png`), anim, layout, columns, rotation);
    console.log(`${entry.action}.png ← ${entry.anim.name} (${entry.anim.frames} frames)`);
  }
  console.log(`cellSize ${layout.size}, columns ${columns}, âncora ${layout.anchorX},${layout.anchorY}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
