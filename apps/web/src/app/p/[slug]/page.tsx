"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { PublicPortfolio } from "@engineerdna/shared";
import { getPublicPortfolio } from "@/services/portfolio";
import { renderPortfolioHtml } from "@/components/portfolio/render";

/** The public, shareable portfolio — renders the chosen theme in an isolated frame. */
export default function PublicPortfolioPage() {
  const params = useParams<{ slug: string }>();
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");
  const [html, setHtml] = useState("");

  useEffect(() => {
    getPublicPortfolio(params.slug)
      .then((p: PublicPortfolio) => {
        setHtml(renderPortfolioHtml(p.theme, p.data));
        setState("ready");
      })
      .catch(() => setState("missing"));
  }, [params.slug]);

  if (state === "missing") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-lg font-semibold">Portfolio not found</p>
        <p className="text-sm text-muted-foreground">This portfolio doesn&apos;t exist or hasn&apos;t been published.</p>
      </div>
    );
  }

  if (state === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }

  return (
    <iframe
      title="Portfolio"
      srcDoc={html}
      className="h-screen w-screen border-0"
      sandbox="allow-scripts allow-popups allow-same-origin"
    />
  );
}
