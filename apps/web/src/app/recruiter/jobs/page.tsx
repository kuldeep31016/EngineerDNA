"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, Loader2, MapPin, Pencil, Plus, Trash2, Users, X } from "lucide-react";
import {
  JOB_TYPES,
  JOB_WORK_MODES,
  type CreateJobInput,
  type JobPost,
  type JobType,
  type JobWorkMode,
} from "@engineerdna/shared";
import { RecruiterGate } from "@/components/recruiter/RecruiterGate";
import { LoadingScreen } from "@/components/LoadingScreen";
import { createJob, deleteJob, listJobs, updateJob } from "@/services/jobs";

const typeLabel = (t: JobType) => JOB_TYPES.find((x) => x.value === t)?.label ?? t;
const modeLabel = (m: JobWorkMode) => JOB_WORK_MODES.find((x) => x.value === m)?.label ?? m;

function JobsContent() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [editing, setEditing] = useState<JobPost | null>(null);
  const [showForm, setShowForm] = useState(false);

  const refresh = () => listJobs().then(setJobs).catch(() => {});
  useEffect(() => {
    listJobs()
      .then(setJobs)
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) return <LoadingScreen label="Loading your job posts…" />;

  function openNew() {
    setEditing(null);
    setShowForm(true);
  }
  function openEdit(job: JobPost) {
    setEditing(job);
    setShowForm(true);
  }

  async function toggleStatus(job: JobPost) {
    await updateJob(job.id, { status: job.status === "OPEN" ? "CLOSED" : "OPEN" });
    void refresh();
  }
  async function remove(job: JobPost) {
    await deleteJob(job.id);
    void refresh();
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Briefcase className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Job Posts</h1>
          <p className="text-sm text-muted-foreground">
            Post roles and see how many verified engineers match.
          </p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Post a job
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className="mt-6 rounded-xl border border-border bg-card px-6 py-14 text-center">
          <Briefcase className="mx-auto h-7 w-7 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">No job posts yet. Post your first role to find matches.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onEdit={() => openEdit(job)}
              onToggle={() => toggleStatus(job)}
              onDelete={() => remove(job)}
              onMatches={() => router.push(`/recruiter/jobs/${job.id}`)}
            />
          ))}
        </div>
      )}

      {showForm && (
        <JobFormModal
          job={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            void refresh();
          }}
        />
      )}
    </main>
  );
}

function JobCard({
  job,
  onEdit,
  onToggle,
  onDelete,
  onMatches,
}: {
  job: JobPost;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onMatches: () => void;
}) {
  const closed = job.status === "CLOSED";
  return (
    <div className={`rounded-xl border border-border bg-card p-5 ${closed ? "opacity-70" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold">{job.title}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                closed ? "bg-muted text-muted-foreground" : "bg-emerald-500/15 text-emerald-300"
              }`}
            >
              {closed ? "Closed" : "Open"}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>{typeLabel(job.type)}</span>
            <span>· {modeLabel(job.workMode)}</span>
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {job.location}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onMatches}
          className="shrink-0 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-center transition-colors hover:bg-primary/20"
        >
          <span className="block text-lg font-bold leading-none text-primary tabular-nums">{job.matchCount}</span>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">matches</span>
        </button>
      </div>

      {job.description && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{job.description}</p>}

      {job.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.skills.map((s) => (
            <span key={s} className="rounded-full border border-border bg-secondary/50 px-2.5 py-0.5 text-xs">
              {s}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={onMatches}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <Users className="h-4 w-4" /> View matches
        </button>
        <button
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
        <button
          onClick={onToggle}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {closed ? "Reopen" : "Close"}
        </button>
        <button
          onClick={onDelete}
          aria-label="Delete job"
          className="ml-auto rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:text-rose-300"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/60";

function JobFormModal({ job, onClose, onSaved }: { job: JobPost | null; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(job?.title ?? "");
  const [description, setDescription] = useState(job?.description ?? "");
  const [skills, setSkills] = useState<string[]>(job?.skills ?? []);
  const [skillInput, setSkillInput] = useState("");
  const [location, setLocation] = useState(job?.location ?? "");
  const [type, setType] = useState<JobType>(job?.type ?? "FULL_TIME");
  const [workMode, setWorkMode] = useState<JobWorkMode>(job?.workMode ?? "ONSITE");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addSkill = (s: string) => {
    const v = s.trim();
    if (v && !skills.some((k) => k.toLowerCase() === v.toLowerCase())) setSkills((p) => [...p, v]);
    setSkillInput("");
  };

  async function save() {
    setBusy(true);
    setError(null);
    const payload: CreateJobInput = {
      title: title.trim(),
      description: description.trim(),
      skills,
      location: location.trim() || undefined,
      type,
      workMode,
    };
    try {
      if (job) await updateJob(job.id, payload);
      else await createJob(payload);
      onSaved();
    } catch {
      setError("Couldn't save the job. Check the title and description, then try again.");
    } finally {
      setBusy(false);
    }
  }

  const ready = title.trim().length > 0 && description.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{job ? "Edit job post" : "Post a job"}</h2>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <Field label="Title">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Senior Backend Engineer" className={inputCls} />
          </Field>
          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="What the role involves, responsibilities, and what you're looking for."
              className={`${inputCls} resize-y`}
            />
          </Field>

          <Field label="Required skills">
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
              {skills.map((s) => (
                <span key={s} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  {s}
                  <button onClick={() => setSkills((p) => p.filter((k) => k !== s))} aria-label={`Remove ${s}`}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addSkill(skillInput);
                  }
                }}
                placeholder={skills.length ? "Add skill…" : "e.g. Spring Boot, Redis…"}
                className="min-w-[8rem] flex-1 bg-transparent text-sm outline-none"
              />
            </div>
          </Field>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Type">
              <select value={type} onChange={(e) => setType(e.target.value as JobType)} className={inputCls}>
                {JOB_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Work mode">
              <select value={workMode} onChange={(e) => setWorkMode(e.target.value as JobWorkMode)} className={inputCls}>
                {JOB_WORK_MODES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Location">
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Bengaluru" className={inputCls} />
            </Field>
          </div>

          {error && <p className="text-xs text-rose-300">{error}</p>}

          <button
            onClick={save}
            disabled={!ready || busy}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} {job ? "Save changes" : "Post job"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

export default function JobsPage() {
  return (
    <RecruiterGate>
      <JobsContent />
    </RecruiterGate>
  );
}
