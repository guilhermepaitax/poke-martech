const PORTRAIT_ASPECT = 17 / 10;
const PORTRAIT_MAX_WIDTH = 1020;
const MAX_EDGE = 1200;
const WEBP_QUALITY = 0.82;
const JPEG_QUALITY = 0.85;
const UPLOAD_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type DrawSource = HTMLImageElement | HTMLCanvasElement;

interface Placement {
  x: number;
  y: number;
  scale: number;
}

interface CoverDraw {
  width: number;
  height: number;
  scale: number;
  dx: number;
  dy: number;
  dw: number;
  dh: number;
}

function computeCoverDraw({
  iw,
  ih,
  x,
  y,
  scale,
  aspect = PORTRAIT_ASPECT,
  maxWidth = PORTRAIT_MAX_WIDTH,
}: Placement & {
  iw: number;
  ih: number;
  aspect?: number;
  maxWidth?: number;
}): CoverDraw {
  const k = scale / 100;
  const cover = Math.max(maxWidth / iw, maxWidth / aspect / ih);
  const shrink = Math.min(1, 1 / (cover * k));
  const width = Math.max(1, Math.round(maxWidth * shrink));
  const height = Math.max(1, Math.round(width / aspect));
  const fit = Math.max(width / iw, height / ih);
  const dw = iw * fit;
  const dh = ih * fit;
  return {
    width,
    height,
    scale: k,
    dx: ((width - dw) * x) / 100,
    dy: ((height - dh) * y) / 100,
    dw,
    dh,
  };
}

function createCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function getContext(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Não foi possível processar a imagem.");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  return context;
}

function sourceSize(source: DrawSource) {
  return source instanceof HTMLImageElement
    ? { width: source.naturalWidth, height: source.naturalHeight }
    : { width: source.width, height: source.height };
}

function downsample(source: DrawSource, targetWidth: number, targetHeight: number) {
  let current = source;
  let { width, height } = sourceSize(source);
  while (width / 2 >= targetWidth && height / 2 >= targetHeight) {
    width = Math.round(width / 2);
    height = Math.round(height / 2);
    const step = createCanvas(width, height);
    getContext(step).drawImage(current, 0, 0, width, height);
    current = step;
  }
  return current;
}

function renderCrop(image: HTMLImageElement, placement: Placement) {
  const draw = computeCoverDraw({
    iw: image.naturalWidth,
    ih: image.naturalHeight,
    ...placement,
  });
  const canvas = createCanvas(draw.width, draw.height);
  const context = getContext(canvas);
  const source = downsample(image, draw.dw * draw.scale, draw.dh * draw.scale);
  context.translate(draw.width / 2, draw.height / 2);
  context.scale(draw.scale, draw.scale);
  context.translate(-draw.width / 2, -draw.height / 2);
  context.beginPath();
  context.rect(0, 0, draw.width, draw.height);
  context.clip();
  context.drawImage(source, draw.dx, draw.dy, draw.dw, draw.dh);
  return canvas;
}

function resizeImage(image: HTMLImageElement, maxEdge = MAX_EDGE) {
  const { width, height } = sourceSize(image);
  const ratio = Math.min(1, maxEdge / Math.max(width, height));
  const targetWidth = Math.max(1, Math.round(width * ratio));
  const targetHeight = Math.max(1, Math.round(height * ratio));
  const canvas = createCanvas(targetWidth, targetHeight);
  const source = downsample(image, targetWidth, targetHeight);
  getContext(canvas).drawImage(source, 0, 0, targetWidth, targetHeight);
  return { canvas, resized: ratio < 1 };
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Não foi possível comprimir a imagem.")),
      type,
      quality,
    );
  });
}

function hasAlpha(canvas: HTMLCanvasElement) {
  const { data } = getContext(canvas).getImageData(0, 0, canvas.width, canvas.height);
  for (let index = 3; index < data.length; index += 4) {
    if (data[index] < 255) return true;
  }
  return false;
}

async function encodeImage(canvas: HTMLCanvasElement, name: string) {
  const base = name.replace(/\.[^.]+$/, "") || "imagem";
  const webp = await toBlob(canvas, "image/webp", WEBP_QUALITY);
  if (webp.type === "image/webp") {
    return new File([webp], `${base}.webp`, { type: "image/webp" });
  }
  if (hasAlpha(canvas)) {
    const png = await toBlob(canvas, "image/png");
    return new File([png], `${base}.png`, { type: "image/png" });
  }
  const jpeg = await toBlob(canvas, "image/jpeg", JPEG_QUALITY);
  return new File([jpeg], `${base}.jpg`, { type: "image/jpeg" });
}

function isLocalUrl(src: string) {
  return src.startsWith("blob:") || src.startsWith("data:");
}

async function loadImage(src: string) {
  const image = new Image();
  if (isLocalUrl(src)) {
    image.src = src;
  } else {
    const url = new URL(src, window.location.href);
    url.searchParams.set("cors", "1");
    image.crossOrigin = "anonymous";
    image.src = url.toString();
  }
  await image.decode();
  return image;
}

async function optimizeImage(file: File, maxEdge = MAX_EDGE) {
  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    const { canvas, resized } = resizeImage(image, maxEdge);
    const encoded = await encodeImage(canvas, file.name);
    const keepOriginal =
      !resized && encoded.size >= file.size && UPLOAD_TYPES.has(file.type);
    return keepOriginal ? file : encoded;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function cropImage(src: string, placement: Placement, name: string) {
  const image = await loadImage(src);
  return encodeImage(renderCrop(image, placement), name);
}

export { computeCoverDraw, cropImage, isLocalUrl, optimizeImage };
export type { CoverDraw, Placement };
