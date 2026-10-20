import type { Page } from "@/types/catalog";

type PageRequest = {
  cursor: number;
  limit: number;
};

type PageSlice<T> = {
  items: T[];
  hasMore: boolean;
};

function toPage<T>(slice: PageSlice<T>, request: PageRequest): Page<T> {
  return {
    items: slice.items,
    nextCursor: slice.hasMore ? String(request.cursor + slice.items.length) : null,
  };
}

function sliceRows<T>(rows: T[], request: PageRequest): PageSlice<T> {
  return { items: rows.slice(0, request.limit), hasMore: rows.length > request.limit };
}

export { sliceRows, toPage };
export type { PageRequest, PageSlice };
