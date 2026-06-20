"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Compute a compact list of page numbers with ellipses, e.g. 1 … 4 5 6 … 12. */
function pageWindow(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  if (start > 2) out.push("…");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < totalPages - 1) out.push("…");
  out.push(totalPages);
  return out;
}

/**
 * Page controls + an "Showing X–Y of N" caption. Renders nothing for a single
 * page. Pair with the usePagination hook (the page does the slicing).
 */
export function Pagination({
  page,
  totalPages,
  onPageChange,
  from,
  to,
  total,
  label = "items",
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  from: number;
  to: number;
  total: number;
  label?: string;
}) {
  if (totalPages <= 1) return null;
  const btn =
    "flex h-8 min-w-8 items-center justify-center rounded-lg border border-border px-2 text-sm transition-colors disabled:opacity-40 disabled:hover:bg-transparent hover:bg-accent";

  return (
    <div className="flex flex-col items-center justify-between gap-3 pt-2 sm:flex-row">
      <p className="text-xs text-muted-foreground">
        Showing <span className="font-medium text-foreground">{from}</span>–
        <span className="font-medium text-foreground">{to}</span> of {total} {label}
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page === 1} className={btn} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pageWindow(page, totalPages).map((p, i) =>
          p === "…" ? (
            <span key={`e${i}`} className="px-1 text-sm text-muted-foreground">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(btn, p === page && "border-primary/40 bg-primary/10 font-medium text-foreground")}
            >
              {p}
            </button>
          ),
        )}
        <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages} className={btn} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
