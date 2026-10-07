const DOWNLOAD_TIMEOUT_MS = 30_000;

async function downloadImage(url: string): Promise<{ bytes: Uint8Array; contentType: string }> {
  if (url.startsWith("data:")) return decodeDataUri(url);
  const res = await fetch(url, { signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Falha ao baixar imagem (HTTP ${res.status}).`);
  const contentType = res.headers.get("content-type")?.split(";")[0]?.trim() || "image/png";
  if (!contentType.startsWith("image/")) throw new Error("O endereço não retornou uma imagem.");
  return { bytes: new Uint8Array(await res.arrayBuffer()), contentType };
}

async function fetchImageAsDataUri(url: string): Promise<string> {
  if (url.startsWith("data:")) return url;
  const image = await downloadImage(url);
  return `data:${image.contentType};base64,${Buffer.from(image.bytes).toString("base64")}`;
}

function decodeDataUri(uri: string) {
  const match = /^data:([^;,]+)(;base64)?,([\s\S]*)$/.exec(uri);
  if (!match) throw new Error("Imagem inválida.");
  const [, contentType, base64, data] = match;
  const bytes = base64 ? Buffer.from(data, "base64") : Buffer.from(decodeURIComponent(data));
  return { bytes: new Uint8Array(bytes), contentType };
}

export { downloadImage, fetchImageAsDataUri };
