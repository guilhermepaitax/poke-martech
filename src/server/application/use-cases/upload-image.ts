import type { Actor } from "@/server/application/actor";
import { requireAdmin } from "@/server/application/authorize";
import type { ObjectStorage } from "@/server/application/contracts/services/object-storage";
import { ValidationError } from "@/server/shared/app-error";
import { err, success, type Result } from "@/server/shared/result";

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

function detectImageType(bytes: Uint8Array): string | null {
  const ascii = (start: number, end: number) =>
    String.fromCharCode(...bytes.subarray(start, end));
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && ascii(1, 4) === "PNG") return "image/png";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  return null;
}

class UploadImage {
  constructor(private readonly storage: ObjectStorage) {}

  async execute(
    input: { filename: string; bytes: Uint8Array },
    actor: Actor | null,
  ): Promise<Result<{ url: string }>> {
    const auth = requireAdmin(actor);
    if (!auth.ok) return auth;
    if (!process.env.R2_BUCKET || !process.env.R2_PUBLIC_URL) {
      return err(new ValidationError("Armazenamento de imagens não configurado."));
    }
    if (input.bytes.byteLength === 0 || input.bytes.byteLength > MAX_UPLOAD_BYTES) {
      return err(new ValidationError("A imagem deve ter até 4 MB."));
    }
    const contentType = detectImageType(input.bytes);
    if (!contentType) {
      return err(new ValidationError("Envie uma imagem JPEG, PNG ou WebP."));
    }
    const url = await this.storage.upload({
      body: input.bytes,
      contentType,
      filename: input.filename,
    });
    return success({ url });
  }
}

export { detectImageType, MAX_UPLOAD_BYTES, UploadImage };
