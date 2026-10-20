import { describe, expect, it } from "vitest";
import { isPrivateAddress } from "@/server/infrastructure/services/remote-image";

describe("remote image", () => {
  it("bloqueia endereços internos", () => {
    for (const address of [
      "127.0.0.1",
      "10.1.2.3",
      "172.20.0.1",
      "192.168.0.10",
      "169.254.169.254",
      "100.64.0.1",
      "0.0.0.0",
      "::1",
      "fd00::1",
      "fe80::1",
      "::ffff:127.0.0.1",
    ]) {
      expect(isPrivateAddress(address), address).toBe(true);
    }
  });

  it("permite endereços públicos", () => {
    for (const address of ["8.8.8.8", "172.32.0.1", "2606:4700::1111"]) {
      expect(isPrivateAddress(address), address).toBe(false);
    }
  });
});
