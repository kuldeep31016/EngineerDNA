"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Loader2,
  MapPin,
  Upload,
  Users,
  X,
} from "lucide-react";
import { JOB_TYPES, JOB_WORK_MODES, type PublicJob } from "@engineerdna/shared";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { getPublicJob } from "@/services/public-jobs";
import { applyToJob } from "@/services/applications";
import { extractResumeFile } from "@/lib/resume";
import { ApiError } from "@/lib/api";

const typeLabel = (t: string) => JOB_TYPES.find((x) => x.value === t)?.label ?? t;
const modeLabel = (m: string) => JOB_WORK_MODES.find((x) => x.value === m)?.label ?? m;

function salaryLabel(min: number | null, max: number | null): string | null {
  if (!min && !max) return null;
  if (min && max) return `₹${(min / 100000).toFixed(1)} – ₹${(max / 100000).toFixed(1)} LPA`;
  if (min) return `₹${(min / 100000).toFixed(1)}+ LPA`;
  return `Up to ₹${(max! / 100000).toFixed(1)} LPA`;
}

function Section({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{content}</p>
    </div>
  );
}

function JobDetailContent() {
  const router = useRouter();
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<PublicJob | null>(null);
  const [missing, setMissing] = useState(false);
  const [applied, setApplied] = useState(false);
  const [showApply, setShowApply] = useState(false);

  useEffect(() => {
    getPublicJob(jobId)
      .then((j) => {
        setJob(j);
        setApplied(j.hasApplied);
      })
      .catch(() => setMissing(true));
  }, [jobId]);

  function onApplied() {
    setApplied(true);
    setShowApply(false);
    setJob((prev) =>
      prev ? { ...prev, hasApplied: true, applicationCount: prev.applicationCount + 1 } : prev,
    );
  }

  if (missing) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-lg font-semibold">Job not found</p>
        <p className="mt-1 text-sm text-muted-foreground">This job may have been closed.</p>
        <button
          onClick={() => router.push("/jobs")}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Back to jobs
        </button>
      </main>
    );
  }

  if (!job) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </main>
    );
  }

  const salary = salaryLabel(job.salaryMin, job.salaryMax);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      {/* Back */}
      <button
        onClick={() => router.push("/jobs")}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to jobs
      </button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main */}
        <div className="space-y-6 lg:col-span-2">
          {/* Header card */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-xl font-bold text-primary">
                {(job.company?.name ?? job.recruiterName ?? "?").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                {job.company ? (
                  <Link href={`/c/${job.company.id}`} className="text-sm text-muted-foreground transition-colors hover:text-primary">
                    {job.company.name}
                  </Link>
                ) : (
                  <p className="text-sm text-muted-foreground">Company</p>
                )}
                <h1 className="text-xl font-bold">{job.title}</h1>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  {job.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {job.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" /> {typeLabel(job.type)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" /> {modeLabel(job.workMode)}
                  </span>
                </div>
              </div>
            </div>

            {/* Skills */}
            {job.skills.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {job.skills.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Description sections */}
          <div className="space-y-6 rounded-2xl border border-border bg-card p-6">
            <Section title="About this role" content={job.description} />
            {job.responsibilities && (
              <Section title="Responsibilities" content={job.responsibilities} />
            )}
            {job.requirements && <Section title="Requirements" content={job.requirements} />}
            {job.benefits && <Section title="Benefits" content={job.benefits} />}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Apply card */}
          <div className="rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-6">
            {applied ? (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <CheckCircle2 className="h-9 w-9 text-emerald-400" />
                <p className="font-semibold">Application submitted</p>
                <p className="text-xs text-muted-foreground">
                  Track its progress in{" "}
                  <a href="/applications" className="text-primary hover:underline">
                    My Applications
                  </a>
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-semibold">Interested in this role?</p>
                <p className="text-xs text-muted-foreground">
                  Apply with your latest resume — it takes less than a minute.
                </p>
                <button
                  onClick={() => setShowApply(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-base font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:opacity-95 hover:shadow-primary/30"
                >
                  Apply now
                </button>
              </div>
            )}
          </div>

          {/* Job details */}
          <div className="space-y-3 rounded-2xl border border-border bg-card p-5 text-sm">
            <h3 className="font-semibold">Job details</h3>
            {salary && (
              <div className="flex justify-between text-muted-foreground">
                <span>Salary</span>
                <span className="font-medium text-foreground">{salary}</span>
              </div>
            )}
            {job.experience && (
              <div className="flex justify-between text-muted-foreground">
                <span>Experience</span>
                <span className="font-medium text-foreground">{job.experience}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> Applicants
              </span>
              <span className="font-medium text-foreground">{job.applicationCount}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Posted
              </span>
              <span className="font-medium text-foreground">
                {new Date(job.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </div>
            {job.deadline && (
              <div className="flex justify-between text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Deadline
                </span>
                <span className="font-medium text-foreground">
                  {new Date(job.deadline).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
            {job.company?.website && (
              <a
                href={job.company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between text-muted-foreground hover:text-foreground"
              >
                <span>Company site</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center text-xs text-emerald-400">
            ✓ Verified recruiter — applications are reviewed by a real person
          </div>
        </div>
      </div>

      {showApply && job && (
        <ApplyModal job={job} onClose={() => setShowApply(false)} onApplied={onApplied} />
      )}
    </main>
  );
}

function ApplyModal({
  job,
  onClose,
  onApplied,
}: {
  job: PublicJob;
  onClose: () => void;
  onApplied: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function onFile(file: File | undefined) {
    if (!file) return;
    setParsing(true);
    setError("");
    try {
      const text = await extractResumeFile(file);
      if (text.trim().length < 30) {
        setError("Couldn't read enough text from that file. Try another resume.");
        setResumeText("");
        setFileName("");
      } else {
        setResumeText(text);
        setFileName(file.name);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't read that file");
      setResumeText("");
      setFileName("");
    } finally {
      setParsing(false);
    }
  }

  async function submit() {
    if (!resumeText || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await applyToJob(job.id, { resumeText, coverLetter: coverLetter || undefined });
      onApplied();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold">Apply to {job.title}</h2>
            <p className="text-xs text-muted-foreground">{job.company?.name ?? "Company"}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Resume upload (required) */}
        <label className="mb-1.5 block text-sm font-medium">
          Upload your resume <span className="text-rose-400">*</span>
        </label>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx,application/pdf"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        {fileName ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2.5">
            <span className="flex min-w-0 items-center gap-2 text-sm">
              <FileText className="h-4 w-4 shrink-0 text-emerald-400" />
              <span className="truncate">{fileName}</span>
            </span>
            <button
              onClick={() => {
                setFileName("");
                setResumeText("");
              }}
              className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
            >
              Change
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={parsing}
            className="flex w-full flex-col items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-6 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-60"
          >
            {parsing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Reading your resume…
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                Click to upload (PDF or DOCX)
              </>
            )}
          </button>
        )}
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Your resume is read in your browser and submitted with this application only.
        </p>

        {/* Cover letter (optional) */}
        <label className="mb-1.5 mt-4 block text-sm font-medium">
          Cover letter <span className="text-muted-foreground">(optional)</span>
        </label>
        <textarea
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          placeholder="A short note to the recruiter…"
          rows={4}
          className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/60"
        />

        {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}

        <button
          onClick={submit}
          disabled={!resumeText || submitting || parsing}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-base font-semibold text-white transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {submitting ? "Submitting…" : "Submit application"}
        </button>
      </div>
    </div>
  );
}

export default function JobDetailPage() {
  return (
    <ProtectedRoute roles={["STUDENT", "ADMIN"]}>
      <JobDetailContent />
    </ProtectedRoute>
  );
}
