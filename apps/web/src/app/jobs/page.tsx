"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Briefcase, Building2, Clock, Filter, MapPin, Search, X } from "lucide-react";
import { JOB_TYPES, JOB_WORK_MODES, type JobType, type JobWorkMode, type PublicJob } from "@engineerdna/shared";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Pagination } from "@/components/ui/Pagination";
import { usePagination } from "@/hooks/usePagination";
import { listPublicJobs } from "@/services/public-jobs";

const typeLabel = (t: JobType) => JOB_TYPES.find((x) => x.value === t)?.label ?? t;
const modeLabel = (m: JobWorkMode) => JOB_WORK_MODES.find((x) => x.value === m)?.label ?? m;

function salaryLabel(min: number | null, max: number | null): string | null {
  if (!min && !max) return null;
  if (min && max) return `₹${(min / 100000).toFixed(1)}–${(max / 100000).toFixed(1)} LPA`;
  if (min) return `₹${(min / 100000).toFixed(1)}+ LPA`;
  return `Up to ₹${(max! / 100000).toFixed(1)} LPA`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

function JobCard({ job }: { job: PublicJob }) {
  const salary = salaryLabel(job.salaryMin, job.salaryMax);

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-black/20"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
          {(job.company?.name ?? job.recruiterName ?? "?").charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-muted-foreground">{job.company?.name ?? "Company"}</p>
          <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
            {job.title}
          </h3>
        </div>
        <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
          Verified
        </span>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {job.location && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {job.location}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Briefcase className="h-3 w-3" /> {typeLabel(job.type)}
        </span>
        <span className="flex items-center gap-1">
          <Building2 className="h-3 w-3" /> {modeLabel(job.workMode)}
        </span>
        {job.experience && <span>{job.experience}</span>}
        {salary && <span className="font-medium text-foreground">{salary}</span>}
      </div>

      {/* Skills */}
      {job.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {job.skills.slice(0, 6).map((s) => (
            <span
              key={s}
              className="rounded-full border border-border bg-secondary/50 px-2.5 py-0.5 text-[11px]"
            >
              {s}
            </span>
          ))}
          {job.skills.length > 6 && (
            <span className="rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground">
              +{job.skills.length - 6}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" /> {timeAgo(job.createdAt)}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{job.applicationCount} applied</span>
          {job.hasApplied ? (
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
              Applied
            </span>
          ) : (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Apply
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function JobsContent() {
  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [workMode, setWorkMode] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const paged = usePagination(jobs, 9);

  function load(filters: { q?: string; type?: string; workMode?: string }) {
    listPublicJobs(filters)
      .then(setJobs)
      .catch(() => setJobs([]))
      .finally(() => setLoaded(true));
  }

  useEffect(() => {
    load({});
  }, []);

  function onSearch(val: string) {
    setQ(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load({ q: val, type, workMode }), 350);
  }

  function onFilter(newType: string, newMode: string) {
    setType(newType);
    setWorkMode(newMode);
    load({ q, type: newType, workMode: newMode });
  }

  function clearFilters() {
    setQ("");
    setType("");
    setWorkMode("");
    load({});
  }

  const hasFilters = q || type || workMode;

  if (!loaded) return <LoadingScreen label="Loading jobs…" />;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Job Board</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {jobs.length} open position{jobs.length !== 1 ? "s" : ""} from verified recruiters
        </p>
      </div>

      {/* Search + Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search by title, company, or location…"
            className="w-full rounded-lg border border-border bg-secondary/50 py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary/60"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={type}
            onChange={(e) => onFilter(e.target.value, workMode)}
            className="rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-primary/60"
          >
            <option value="">All types</option>
            {JOB_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <select
            value={workMode}
            onChange={(e) => onFilter(type, e.target.value)}
            className="rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-primary/60"
          >
            <option value="">All modes</option>
            {JOB_WORK_MODES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Active filter chips */}
      {hasFilters && (
        <div className="mb-4 flex flex-wrap gap-2 text-xs">
          {q && (
            <span className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-primary">
              <Search className="h-3 w-3" /> &quot;{q}&quot;
            </span>
          )}
          {type && (
            <span className="flex items-center gap-1 rounded-full border border-border bg-secondary px-3 py-1">
              <Filter className="h-3 w-3" /> {typeLabel(type as JobType)}
            </span>
          )}
          {workMode && (
            <span className="flex items-center gap-1 rounded-full border border-border bg-secondary px-3 py-1">
              <Building2 className="h-3 w-3" /> {modeLabel(workMode as JobWorkMode)}
            </span>
          )}
        </div>
      )}

      {/* Grid */}
      {jobs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-6 py-20 text-center">
          <Briefcase className="h-10 w-10 text-muted-foreground/40" />
          <p className="font-semibold">No jobs found</p>
          <p className="text-sm text-muted-foreground">Try adjusting your filters.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {paged.pageItems.map((j) => (
              <JobCard key={j.id} job={j} />
            ))}
          </div>
          <div className="mt-5">
            <Pagination
              page={paged.page}
              totalPages={paged.totalPages}
              onPageChange={paged.setPage}
              from={paged.from}
              to={paged.to}
              total={paged.total}
              label="jobs"
            />
          </div>
        </>
      )}
    </main>
  );
}

export default function JobsPage() {
  return (
    <ProtectedRoute roles={["STUDENT", "ADMIN"]}>
      <JobsContent />
    </ProtectedRoute>
  );
}
