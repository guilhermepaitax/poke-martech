import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { isStorageUrl } from "@/lib/storage-url";

const DOWNLOAD_TIMEOUT_MS = 30_000;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_REDIRECTS = 3;

async function downloadImage(url: string): Promise<{ bytes: Uint8Array; contentType: string }> {
  if (url.startsWith("data:")) return decodeDataUri(url);
  const signal = AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS);
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    await assertPublicUrl(current);
    const res = await fetch(current, { signal, redirect: "manual" });
    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      current = new URL(location, current).toString();
      continue;
    }
    if (!res.ok) throw new Error(`Falha ao baixar imagem (HTTP ${res.status}).`);
    const contentType = res.headers.get("content-type")?.split(";")[0]?.trim() || "image/png";
    if (!contentType.startsWith("image/")) throw new Error("O endereço não retornou uma imagem.");
    return { bytes: await readLimited(res), contentType };
  }
  throw new Error("Redirecionamentos demais ao baixar a imagem.");
}

async function fetchImageAsDataUri(url: string): Promise<string> {
  if (url.startsWith("data:")) return url;
  const image = await downloadImage(url);
  return `data:${image.contentType};base64,${Buffer.from(image.bytes).toString("base64")}`;
}

async function assertPublicUrl(url: string) {
  if (isStorageUrl(url)) return;
  const parsed = new URL(url);
  if (parsed.protocol !== "https:") throw new Error("A imagem precisa usar HTTPS.");
  const host = parsed.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(host)
    ? [host]
    : (await lookup(host, { all: true })).map((entry) => entry.address);
  if (addresses.length === 0 || addresses.some(isPrivateAddress)) {
    throw new Error("Endereço de imagem não permitido.");
  }
}

function isPrivateAddress(address: string) {
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(address);
  const ip = mapped ? mapped[1] : address;
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    );
  }
  const lower = ip.toLowerCase();
  return (
    lower === "::" ||
    lower === "::1" ||
    lower.startsWith("fc") ||
    lower.startsWith("fd") ||
    /^fe[89ab]/.test(lower)
  );
}

async function readLimited(res: Response): Promise<Uint8Array> {
  const declared = Number(res.headers.get("content-length") ?? 0);
  if (declared > MAX_IMAGE_BYTES) throw new Error("A imagem passa de 10 MB.");
  if (!res.body) return new Uint8Array(await res.arrayBuffer());
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_IMAGE_BYTES) {
      await reader.cancel();
      throw new Error("A imagem passa de 10 MB.");
    }
    chunks.push(value);
  }
  return new Uint8Array(Buffer.concat(chunks));
}

function decodeDataUri(uri: string) {
  const match = /^data:([^;,]+)(;base64)?,([\s\S]*)$/.exec(uri);
  if (!match) throw new Error("Imagem inválida.");
  const [, contentType, base64, data] = match;
  const bytes = base64 ? Buffer.from(data, "base64") : Buffer.from(decodeURIComponent(data));
  if (bytes.byteLength > MAX_IMAGE_BYTES) throw new Error("A imagem passa de 10 MB.");
  return { bytes: new Uint8Array(bytes), contentType };
}

export { downloadImage, fetchImageAsDataUri, isPrivateAddress };
