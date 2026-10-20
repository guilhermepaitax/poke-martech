import { describe, expect, it } from "vitest";
import { sliceRows, toPage } from "@/server/application/page";

describe("page", () => {
  it("corta a linha extra e aponta o próximo cursor", () => {
    const request = { cursor: 20, limit: 2 };
    const slice = sliceRows(["a", "b", "c"], request);
    expect(slice).toEqual({ items: ["a", "b"], hasMore: true });
    expect(toPage(slice, request)).toEqual({ items: ["a", "b"], nextCursor: "22" });
  });

  it("encerra quando não sobra linha", () => {
    const request = { cursor: 0, limit: 2 };
    expect(toPage(sliceRows(["a"], request), request)).toEqual({ items: ["a"], nextCursor: null });
  });
});
