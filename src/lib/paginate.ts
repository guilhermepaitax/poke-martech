const PAGE_SIZE = 20;

type PageToken = number | "gap";

function paginate<T>(items: T[], page: number, pageSize = PAGE_SIZE) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(1, page), pageCount);
  const start = (current - 1) * pageSize;
  return {
    page: current,
    pageCount,
    items: items.slice(start, start + pageSize),
  };
}

function pageWindow(page: number, pageCount: number): PageToken[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }
  const pages = [1, pageCount, page - 1, page, page + 1].filter(
    (value, index, all) => value >= 1 && value <= pageCount && all.indexOf(value) === index,
  );
  pages.sort((left, right) => left - right);
  const window: PageToken[] = [];
  for (const value of pages) {
    const previous = window[window.length - 1];
    if (typeof previous === "number" && value - previous > 1) window.push("gap");
    window.push(value);
  }
  return window;
}

export { PAGE_SIZE, pageWindow, paginate };
export type { PageToken };
