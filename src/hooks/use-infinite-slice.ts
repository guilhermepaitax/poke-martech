"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { PAGE_SIZE } from "@/lib/paginate";

function useInfiniteSlice<T extends { id: string }>(items: T[], pageSize = PAGE_SIZE) {
  const listKey = useMemo(() => items.map((item) => item.id).join("\0"), [items]);
  const [state, setState] = useState({ key: listKey, count: pageSize });
  const count = state.key === listKey ? state.count : pageSize;
  const visible = items.slice(0, count);
  const hasMore = count < items.length;
  const observerRef = useRef<IntersectionObserver | null>(null);
  const revealMore = useCallback(() => {
    setState((current) => {
      const base = current.key === listKey ? current.count : pageSize;
      if (base >= items.length) {
        return current.key === listKey ? current : { key: listKey, count: pageSize };
      }
      return { key: listKey, count: Math.min(items.length, base + pageSize) };
    });
  }, [items.length, listKey, pageSize]);
  const sentinelRef = useCallback(
    (node: HTMLParagraphElement | null) => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      if (!node) return;
      node.dataset.shown = String(count);
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) revealMore();
      });
      observer.observe(node);
      observerRef.current = observer;
    },
    [count, revealMore],
  );

  return { visible, hasMore, sentinelRef };
}

export { useInfiniteSlice };
