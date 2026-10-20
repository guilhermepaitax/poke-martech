import { profileInputError } from "@/lib/user-profile-input";
import { describe, expect, it } from "vitest";

const publicUrl = "https://cdn.example.com/bucket";

describe("profile input", () => {
  it("bloqueia campos travados na atualização", () => {
    expect(profileInputError({ username: "outro" }, "update", publicUrl)?.code).toBe(
      "FIELD_NOT_EDITABLE",
    );
    expect(profileInputError({ imageUseConsent: false }, "update", publicUrl)?.code).toBe(
      "FIELD_NOT_EDITABLE",
    );
  });

  it("aceita username no cadastro", () => {
    expect(profileInputError({ username: "ana", name: "Ana" }, "sign-up", publicUrl)).toBeNull();
  });

  it("limita nome e bio", () => {
    expect(profileInputError({ name: "a".repeat(61) }, "update", publicUrl)?.code).toBe(
      "INVALID_NAME",
    );
    expect(profileInputError({ name: "  " }, "update", publicUrl)?.code).toBe("INVALID_NAME");
    expect(profileInputError({ bio: "a".repeat(281) }, "update", publicUrl)?.code).toBe(
      "INVALID_BIO",
    );
    expect(profileInputError({ bio: "oi" }, "update", publicUrl)).toBeNull();
  });

  it("só aceita imagem do armazenamento do app", () => {
    expect(
      profileInputError({ image: "https://evil.example/pixel.png" }, "update", publicUrl)?.code,
    ).toBe("INVALID_IMAGE");
    expect(
      profileInputError({ image: "https://cdn.example.com/bucket-evil/x.png" }, "update", publicUrl)
        ?.code,
    ).toBe("INVALID_IMAGE");
    expect(
      profileInputError({ image: `${publicUrl}/uploads/a.png` }, "update", publicUrl),
    ).toBeNull();
    expect(profileInputError({ image: null }, "update", publicUrl)).toBeNull();
    expect(profileInputError({ image: "https://x/y.png" }, "update", undefined)?.code).toBe(
      "INVALID_IMAGE",
    );
  });
});
