"use client";

import { useEffect, useMemo, useState } from "react";

export interface Pagination<T> {
  page: number;
  setPage: (p: number) => void;
  totalPages: number;
  pageItems: T[];
  total: number;
  pageSize: number;
  from: number; // 1-based index of the first item on this page
  to: number; // 1-based index of the last item on this page
}

/**
 * Client-side pagination over an in-memory list. Keeps the current page valid
 * when the list shrinks (e.g. after a filter) by clamping back into range.
 */
export function usePagination<T>(items: T[], pageSize = 10): Pagination<T> {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageItems = useMemo(() => items.slice(start, start + pageSize), [items, start, pageSize]);

  return {
    page: safePage,
    setPage,
    totalPages,
    pageItems,
    total: items.length,
    pageSize,
    from: items.length === 0 ? 0 : start + 1,
    to: Math.min(start + pageSize, items.length),
  };
}
