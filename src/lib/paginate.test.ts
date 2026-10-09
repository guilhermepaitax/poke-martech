import { describe, expect, it } from "vitest";
import { pageWindow, paginate } from "./paginate";

describe("paginate", () => {
  const items = Array.from({ length: 45 }, (_, index) => index + 1);

  it("returns the first page of 20", () => {
    const page = paginate(items, 1);
    expect(page.page).toBe(1);
    expect(page.pageCount).toBe(3);
    expect(page.items).toEqual(items.slice(0, 20));
  });

  it("returns the requested page and clamps past the end", () => {
    expect(paginate(items, 2).items).toEqual(items.slice(20, 40));
    expect(paginate(items, 9).page).toBe(3);
    expect(paginate(items, 9).items).toEqual(items.slice(40));
  });

  it("keeps an empty list on a single page", () => {
    expect(paginate([], 1)).toEqual({ page: 1, pageCount: 1, items: [] });
  });
});

describe("pageWindow", () => {
  it("lists every page when there are few of them", () => {
    expect(pageWindow(2, 4)).toEqual([1, 2, 3, 4]);
  });

  it("collapses distant pages", () => {
    expect(pageWindow(5, 10)).toEqual([1, "gap", 4, 5, 6, "gap", 10]);
    expect(pageWindow(1, 10)).toEqual([1, 2, "gap", 10]);
  });
});
