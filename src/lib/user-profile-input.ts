import { isStorageUrl } from "@/lib/storage-url";

const MAX_NAME_LENGTH = 60;
const MAX_BIO_LENGTH = 280;
const LOCKED_UPDATE_FIELDS = ["username", "imageUseConsent", "role", "banned"] as const;

type ProfileInputError = { code: string; message: string };

function field(body: unknown, key: string) {
  if (!body || typeof body !== "object" || !(key in body)) return undefined;
  return (body as Record<string, unknown>)[key];
}

function profileInputError(
  body: unknown,
  mode: "sign-up" | "update",
  publicUrl: string | undefined,
): ProfileInputError | null {
  if (mode === "update") {
    const locked = LOCKED_UPDATE_FIELDS.find((key) => field(body, key) !== undefined);
    if (locked) {
      return { code: "FIELD_NOT_EDITABLE", message: "Esse campo não pode ser alterado." };
    }
  }

  const name = field(body, "name");
  if (name !== undefined && (typeof name !== "string" || name.trim().length > MAX_NAME_LENGTH)) {
    return {
      code: "INVALID_NAME",
      message: `O nome pode ter no máximo ${MAX_NAME_LENGTH} caracteres.`,
    };
  }
  if (mode === "update" && typeof name === "string" && !name.trim()) {
    return { code: "INVALID_NAME", message: "Informe seu nome." };
  }

  const bio = field(body, "bio");
  if (bio !== undefined && (typeof bio !== "string" || bio.length > MAX_BIO_LENGTH)) {
    return {
      code: "INVALID_BIO",
      message: `A bio pode ter no máximo ${MAX_BIO_LENGTH} caracteres.`,
    };
  }

  const image = field(body, "image");
  if (
    image !== undefined &&
    image !== null &&
    image !== "" &&
    (typeof image !== "string" || !publicUrl || !isStorageUrl(image, publicUrl))
  ) {
    return { code: "INVALID_IMAGE", message: "Envie a foto pelo upload do app." };
  }

  return null;
}

export { MAX_BIO_LENGTH, MAX_NAME_LENGTH, profileInputError };
