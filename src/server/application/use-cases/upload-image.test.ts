import { describe, expect, it } from "vitest";
import { detectImageType } from "@/server/application/use-cases/upload-image";

const bytes = (...values: (number | string)[]) =>
  new Uint8Array(
    values.flatMap((value) =>
      typeof value === "string" ? [...value].map((char) => char.charCodeAt(0)) : [value],
    ),
  );

describe("upload image", () => {
  it("detecta o tipo real pelos primeiros bytes", () => {
    expect(detectImageType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
    expect(detectImageType(bytes(0x89, "PNG", 0x0d, 0x0a))).toBe("image/png");
    expect(detectImageType(bytes("RIFF", 0, 0, 0, 0, "WEBP"))).toBe("image/webp");
  });

  it("recusa arquivos que não são imagem", () => {
    expect(detectImageType(bytes("<html><script>"))).toBeNull();
    expect(detectImageType(bytes("<svg"))).toBeNull();
    expect(detectImageType(new Uint8Array())).toBeNull();
  });
});
