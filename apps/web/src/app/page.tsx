"use client";

import { useEffect, useState } from "react";
import {
  APP_NAME,
  APP_TAGLINE,
  healthResponseSchema,
  type HealthResponse,
} from "@engineerdna/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type ApiStatus =
  | { state: "loading" }
  | { state: "ok"; data: HealthResponse }
  | { state: "error"; message: string };

/**
 * Foundation landing page (Module 1). No product features yet — it exists to
 * prove the full stack is wired: the web app reaches the API and validates the
 * response against the SHARED contract.
 */
export default function HomePage() {
  const [status, setStatus] = useState<ApiStatus>({ state: "loading" });

  useEffect(() => {
    let active = true;
    fetch(`${API_URL}/health`, { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        const parsed = healthResponseSchema.parse(json);
        if (active) setStatus({ state: "ok", data: parsed });
      })
      .catch((err: unknown) => {
        if (active)
          setStatus({
            state: "error",
            message: err instanceof Error ? err.message : "Unknown error",
          });
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 px-6 py-20">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="rounded-full border border-border px-4 py-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {APP_TAGLINE}
        </span>
        <h1 className="bg-gradient-to-b from-foreground to-muted-foreground bg-clip-text text-6xl font-bold tracking-tight text-transparent">
          {APP_NAME}
        </h1>
        <p className="max-w-xl text-balance text-lg text-muted-foreground">
          A verified engineering identity built from evidence — not resume claims.
          The foundation is live. Modules ship next.
        </p>
      </div>

      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium">API status</span>
          <StatusDot status={status} />
        </div>
        <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs text-muted-foreground">
          {status.state === "loading" && "Checking API…"}
          {status.state === "error" && `Unreachable: ${status.message}`}
          {status.state === "ok" && JSON.stringify(status.data, null, 2)}
        </pre>
      </div>
    </main>
  );
}

function StatusDot({ status }: { status: ApiStatus }) {
  const color =
    status.state === "ok"
      ? "bg-green-500"
      : status.state === "error"
        ? "bg-red-500"
        : "bg-yellow-500";
  const label =
    status.state === "ok" ? "Healthy" : status.state === "error" ? "Down" : "…";
  return (
    <span className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}
