import { describe, expect, it } from "vitest";
import { ARENA_WIN_REWARD, arenaDayStart } from "@/lib/arena/rewards";

describe("arenaDayStart", () => {
  it("starts the day at midnight in São Paulo", () => {
    expect(arenaDayStart(new Date("2026-10-21T15:30:00Z")).toISOString()).toBe(
      "2026-10-21T03:00:00.000Z",
    );
  });

  it("keeps the previous day until 03:00 UTC", () => {
    expect(arenaDayStart(new Date("2026-10-22T02:59:59.900Z")).toISOString()).toBe(
      "2026-10-21T03:00:00.000Z",
    );
    expect(arenaDayStart(new Date("2026-10-22T03:00:00Z")).toISOString()).toBe(
      "2026-10-22T03:00:00.000Z",
    );
  });
});

describe("ARENA_WIN_REWARD", () => {
  it("pays more on harder levels", () => {
    expect(ARENA_WIN_REWARD).toEqual({ easy: 2, normal: 5, hard: 10 });
  });
});
