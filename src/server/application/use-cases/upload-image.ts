import type { Actor } from "@/server/application/actor";
import { requireAdmin } from "@/server/application/authorize";
import type { ObjectStorage } from "@/server/application/contracts/services/object-storage";
import { ValidationError } from "@/server/shared/app-error";
import { err, success, type Result } from "@/server/shared/result";

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

class UploadImage {
  constructor(private readonly storage: ObjectStorage) {}

  async execute(
    input: { filename: string; contentType: string; bytes: Uint8Array },
    actor: Actor | null,
  ): Promise<Result<{ url: string }>> {
    const auth = requireAdmin(actor);
    if (!auth.ok) return auth;
    if (!process.env.R2_BUCKET || !process.env.R2_PUBLIC_URL) {
      return err(new ValidationError("Armazenamento de imagens não configurado."));
    }
    if (!ALLOWED.has(input.contentType)) {
      return err(new ValidationError("Envie uma imagem JPEG, PNG ou WebP."));
    }
    if (input.bytes.byteLength === 0 || input.bytes.byteLength > MAX_BYTES) {
      return err(new ValidationError("A imagem deve ter até 4 MB."));
    }
    const url = await this.storage.upload({
      body: input.bytes,
      contentType: input.contentType,
      filename: input.filename,
    });
    return success({ url });
  }
}

export { UploadImage };
