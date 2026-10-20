"use client";

import { useCallback, useEffect, useRef } from "react";

function useLoadMore(canLoad: boolean, loadMore: () => void) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const latest = useRef({ canLoad, loadMore });
  useEffect(() => {
    latest.current = { canLoad, loadMore };
  });

  return useCallback(
    (node: HTMLElement | null) => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      if (!node || !canLoad) return;
      const observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        if (latest.current.canLoad) latest.current.loadMore();
      });
      observer.observe(node);
      observerRef.current = observer;
    },
    [canLoad],
  );
}

export { useLoadMore };
