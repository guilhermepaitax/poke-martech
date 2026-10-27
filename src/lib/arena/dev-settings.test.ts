import { describe, expect, it } from "vitest";
import { DEFAULT_DEV_SETTINGS, parseDevSettings } from "./dev-settings";

describe("parseDevSettings", () => {
  it("volta ao padrão sem nada salvo", () => {
    expect(parseDevSettings(null)).toEqual(DEFAULT_DEV_SETTINGS);
    expect(parseDevSettings("lixo")).toEqual(DEFAULT_DEV_SETTINGS);
  });

  it("aproveita só as chaves conhecidas com booleano", () => {
    const settings = parseDevSettings({ cpuAttacks: false, noCooldowns: "sim", extra: true });
    expect(settings).toEqual({ ...DEFAULT_DEV_SETTINGS, cpuAttacks: false });
    expect(settings).not.toHaveProperty("extra");
  });
});
