"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, ClipboardList } from "lucide-react";
import {
  APPLICATION_STATUSES,
  JOB_TYPES,
  type ApplicationStatus,
  type MyApplication,
  type StudentApplicationStats,
} from "@engineerdna/shared";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LoadingScreen } from "@/components/LoadingScreen";
import { LifecyclePanel } from "@/components/applications/LifecyclePanel";
import { Pagination } from "@/components/ui/Pagination";
import { usePagination } from "@/hooks/usePagination";
import { getMyApplications, getMyApplicationStats } from "@/services/applications";

function statusInfo(status: ApplicationStatus): { value: ApplicationStatus; label: string; color: string } {
  return (
    APPLICATION_STATUSES.find((s) => s.value === status) ?? {
      value: status,
      label: status,
      color: "text-muted-foreground",
    }
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function ApplicationCard({ app }: { app: MyApplication }) {
  const info = statusInfo(app.status);
  const company = app.job.company?.name ?? "Company";
  const jobType = JOB_TYPES.find((t) => t.value === app.job.type)?.label ?? app.job.type;
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-bold text-primary">
            {company.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="text-sm font-semibold">{app.job.title}</span>
            <p className="text-xs text-muted-foreground">
              {company} · {jobType}
              {app.job.location ? ` · ${app.job.location}` : ""}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="flex flex-col items-end gap-1">
            <span className={`text-xs font-medium ${info.color}`}>{info.label}</span>
            <p className="text-[11px] text-muted-foreground">
              Applied{" "}
              {new Date(app.appliedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </p>
          </div>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {open && (
        <div className="border-t border-border p-4">
          <Link href={`/jobs/${app.job.id}`} className="mb-3 inline-block text-xs text-primary hover:underline">
            View job posting →
          </Link>
          <LifecyclePanel applicationId={app.id} role="student" />
        </div>
      )}
    </div>
  );
}

function ApplicationsContent() {
  const [apps, setApps] = useState<MyApplication[]>([]);
  const [stats, setStats] = useState<StudentApplicationStats | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<ApplicationStatus | "">("");

  useEffect(() => {
    Promise.all([getMyApplications(), getMyApplicationStats()])
      .then(([a, s]) => {
        setApps(a);
        setStats(s);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const filtered = filter ? apps.filter((a) => a.status === filter) : apps;
  const paged = usePagination(filtered, 10);

  if (!loaded) return <LoadingScreen label="Loading your applications…" />;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">My Applications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track every job you&apos;ve applied to
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="mb-8 grid grid-cols-5 gap-3">
          <StatCard label="Applied" value={stats.total} color="text-foreground" />
          <StatCard label="Shortlisted" value={stats.shortlisted} color="text-violet-400" />
          <StatCard label="Interviews" value={stats.interviews} color="text-cyan-400" />
          <StatCard label="Offers" value={stats.offers} color="text-emerald-400" />
          <StatCard label="Rejected" value={stats.rejected} color="text-rose-400" />
        </div>
      )}

      {/* Filter tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("")}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            filter === ""
              ? "bg-primary/10 text-primary ring-1 ring-primary/30"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          All ({apps.length})
        </button>
        {APPLICATION_STATUSES.map((s) => {
          const count = apps.filter((a) => a.status === s.value).length;
          if (count === 0) return null;
          return (
            <button
              key={s.value}
              onClick={() => setFilter(s.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filter === s.value
                  ? `bg-primary/10 text-primary ring-1 ring-primary/30`
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.label} ({count})
            </button>
          );
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-6 py-20 text-center">
          <ClipboardList className="h-10 w-10 text-muted-foreground/40" />
          {apps.length === 0 ? (
            <>
              <p className="font-semibold">No applications yet</p>
              <p className="text-sm text-muted-foreground">
                Browse the{" "}
                <Link href="/jobs" className="text-primary hover:underline">
                  job board
                </Link>{" "}
                and apply to your first role.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No applications with this status.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {paged.pageItems.map((app) => (
            <ApplicationCard key={app.id} app={app} />
          ))}
          <Pagination
            page={paged.page}
            totalPages={paged.totalPages}
            onPageChange={paged.setPage}
            from={paged.from}
            to={paged.to}
            total={paged.total}
            label="applications"
          />
        </div>
      )}
    </main>
  );
}

export default function ApplicationsPage() {
  return (
    <ProtectedRoute roles={["STUDENT", "ADMIN"]}>
      <ApplicationsContent />
    </ProtectedRoute>
  );
}
