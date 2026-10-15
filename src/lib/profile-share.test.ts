import { describe, expect, it } from "vitest";
import {
  isShareCrawler,
  profileShareDescription,
  profileSharePath,
  safeCallbackUrl,
} from "@/lib/profile-share";
import { resolveProxyAccess } from "@/lib/proxy-access";

describe("profile share paths", () => {
  it("builds the follow invite link", () => {
    expect(profileSharePath("ash")).toBe("/u/ash?seguir=1");
  });

  it("accepts only profile callbacks", () => {
    expect(safeCallbackUrl("/u/Ash")).toBe("/u/ash");
    expect(safeCallbackUrl("/u/ash?seguir=1")).toBe("/u/ash?seguir=1");
    expect(safeCallbackUrl(encodeURIComponent("/u/ash?seguir=1"))).toBe("/u/ash?seguir=1");
    expect(safeCallbackUrl("https://evil.test/u/ash")).toBeNull();
    expect(safeCallbackUrl("//evil.test")).toBeNull();
    expect(safeCallbackUrl("/home")).toBeNull();
    expect(safeCallbackUrl("/u/ash?seguir=1&next=https://evil.test")).toBeNull();
  });

  it("describes the profile for previews", () => {
    expect(
      profileShareDescription({ name: "Ash", bio: "", followerCount: 1 }),
    ).toBe("Ash coleciona e troca cartas no PokeMartech. 1 seguidor.");
    expect(
      profileShareDescription({
        name: "Misty",
        bio: "Água em Cerulean.",
        followerCount: 12,
      }),
    ).toBe("Água em Cerulean. 12 seguidores.");
  });

  it("recognizes share crawlers", () => {
    expect(isShareCrawler("WhatsApp/2.23.20.0")).toBe(true);
    expect(isShareCrawler("facebookexternalhit/1.1")).toBe(true);
    expect(isShareCrawler("Mozilla/5.0 Chrome/120.0.0.0")).toBe(false);
  });
});

describe("resolveProxyAccess", () => {
  it("sends logged-out people from a shared profile to login", () => {
    expect(
      resolveProxyAccess({
        pathname: "/u/ash",
        search: "?seguir=1",
        userAgent: "Mozilla/5.0",
        hasSession: false,
        callbackUrl: null,
      }),
    ).toEqual({
      type: "redirect",
      path: "/entrar?callbackUrl=%2Fu%2Fash%3Fseguir%3D1",
    });
  });

  it("lets share crawlers read the profile preview", () => {
    expect(
      resolveProxyAccess({
        pathname: "/u/ash",
        search: "?seguir=1",
        userAgent: "Twitterbot/1.0",
        hasSession: false,
        callbackUrl: null,
      }),
    ).toEqual({ type: "rewrite", pathname: "/perfil/ash" });
  });

  it("returns a logged-in person to the shared profile", () => {
    expect(
      resolveProxyAccess({
        pathname: "/entrar",
        search: "",
        userAgent: "Mozilla/5.0",
        hasSession: true,
        callbackUrl: "/u/ash?seguir=1",
      }),
    ).toEqual({ type: "redirect", path: "/u/ash?seguir=1" });
  });
});
