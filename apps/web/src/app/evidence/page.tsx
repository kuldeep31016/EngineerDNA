"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Boxes,
  Cloud,
  Code2,
  Database,
  FlaskConical,
  Loader2,
  Package,
  Rocket,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import type {
  DeveloperEvidence,
  DeveloperEvidenceItem,
  TechCategory,
} from "@engineerdna/shared";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Button } from "@/components/ui/button";
import { buildEvidence, getEvidence } from "@/services/evidence";

const CATEGORY_ORDER: TechCategory[] = [
  "LANGUAGE",
  "FRAMEWORK",
  "DATABASE",
  "AUTH",
  "CLOUD",
  "DEPLOYMENT",
  "TESTING",
  "TOOL",
  "LIBRARY",
];

const CATEGORY_META: Record<TechCategory, { label: string; icon: typeof Code2 }> = {
  LANGUAGE: { label: "Languages", icon: Code2 },
  FRAMEWORK: { label: "Frameworks", icon: Boxes },
  DATABASE: { label: "Databases", icon: Database },
  AUTH: { label: "Authentication", icon: ShieldCheck },
  CLOUD: { label: "Cloud", icon: Cloud },
  DEPLOYMENT: { label: "Deployment", icon: Rocket },
  TESTING: { label: "Testing", icon: FlaskConical },
  TOOL: { label: "Tooling", icon: Wrench },
  LIBRARY: { label: "Libraries", icon: Package },
};

function EvidenceContent() {
  const [data, setData] = useState<DeveloperEvidence | null>(null);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);

  useEffect(() => {
    void getEvidence().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  const build = useCallback(async () => {
    setBuilding(true);
    try {
      setData(await buildEvidence());
    } finally {
      setBuilding(false);
    }
  }, []);

  if (loading || !data) return <LoadingScreen label="Loading evidence…" />;

  const verified = data.items.filter((i) => i.strength === "USED");
  const repos = new Set(data.items.flatMap((i) => i.repositories)).size;

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Evidence</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            What you’ve actually used — proven by your repositories, not claimed.
          </p>
        </div>
        <Button onClick={build} disabled={building}>
          {building ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
          {building ? "Building…" : "Build evidence"}
        </Button>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <Stat label="Technologies" value={data.items.length} />
        <Stat label="Verified (used)" value={verified.length} accent />
        <Stat label="From repositories" value={repos} />
      </div>

      {data.items.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="mt-6 space-y-4">
            {CATEGORY_ORDER.map((cat) => {
              const items = data.items.filter((i) => i.category === cat);
              if (items.length === 0) return null;
              return <CategoryCard key={cat} category={cat} items={items} />;
            })}
          </div>

          {data.timeline.length > 0 && <Timeline data={data} />}
        </>
      )}
    </main>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className={`text-2xl font-bold ${accent ? "text-emerald-400" : ""}`}>{value}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function StrengthBadge({ strength }: { strength: "USED" | "MENTIONED" }) {
  if (strength === "USED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400 ring-1 ring-emerald-500/20">
        <BadgeCheck className="h-3 w-3" /> Verified
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-400 ring-1 ring-amber-500/20">
      Mentioned
    </span>
  );
}

function CategoryCard({
  category,
  items,
}: {
  category: TechCategory;
  items: DeveloperEvidenceItem[];
}) {
  const { label, icon: Icon } = CATEGORY_META[category];
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-semibold">{label}</h3>
        <span className="text-xs text-muted-foreground">({items.length})</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.technology}
            className="rounded-lg border border-border/70 bg-background/40 p-3"
            title={item.proofs.map((p) => p.detail).join("\n")}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-medium">{item.technology}</span>
              <StrengthBadge strength={item.strength} />
            </div>
            <div className="mt-1 truncate text-xs text-muted-foreground">
              {item.repositoryCount} repo{item.repositoryCount === 1 ? "" : "s"}
              {item.proofs[0] ? ` · ${item.proofs[0].detail}` : ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Timeline({ data }: { data: DeveloperEvidence }) {
  return (
    <div className="mt-6 rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Rocket className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-semibold">Evidence timeline</h3>
        <span className="text-xs text-muted-foreground">when you first used each technology</span>
      </div>
      <ol className="relative ml-2 border-l border-border">
        {[...data.timeline].reverse().map((entry) => (
          <li key={`${entry.technology}-${entry.firstSeenAt}`} className="mb-4 ml-4 last:mb-0">
            <span className="absolute -left-[5px] mt-1.5 h-2 w-2 rounded-full bg-primary" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                {new Date(entry.firstSeenAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                })}
              </span>
              <span className="font-medium">{entry.technology}</span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-6 rounded-xl border border-border bg-card px-6 py-16 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <BadgeCheck className="h-6 w-6" />
      </span>
      <p className="mt-3 font-medium">No evidence yet</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        Go to{" "}
        <Link href="/repositories" className="text-primary hover:underline">
          Repositories
        </Link>
        , select the repos you want analyzed, then click <span className="font-medium">Build evidence</span>.
      </p>
    </div>
  );
}

export default function EvidencePage() {
  return (
    <ProtectedRoute>
      <EvidenceContent />
    </ProtectedRoute>
  );
}
