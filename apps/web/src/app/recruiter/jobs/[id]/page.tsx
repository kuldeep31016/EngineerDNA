"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  CalendarClock,
  ChevronDown,
  ClipboardList,
  ExternalLink,
  FileSearch,
  FolderGit2,
  Github,
  Loader2,
  MapPin,
  MessagesSquare,
  ShieldCheck,
  Trophy,
  Users,
  X,
} from "lucide-react";
import type { JobPost, ProctoringReport, RankedCandidate, RecruiterApplicant } from "@engineerdna/shared";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@engineerdna/shared";
import { RecruiterGate } from "@/components/recruiter/RecruiterGate";
import { LoadingScreen } from "@/components/LoadingScreen";
import { LifecyclePanel } from "@/components/applications/LifecyclePanel";
import { addShortlist, removeShortlist } from "@/services/recruiter";
import { getJob, getJobRanking } from "@/services/jobs";
import { getJobApplications, updateApplicationStatus } from "@/services/applications";
import { inviteCandidate } from "@/services/messaging";

type Tab = "ranking" | "applications";

function scoreColor(v: number): string {
  if (v >= 75) return "text-emerald-400";
  if (v >= 50) return "text-amber-400";
  return "text-rose-400";
}
function barColor(v: number): string {
  if (v >= 75) return "bg-emerald-500";
  if (v >= 50) return "bg-amber-500";
  return "bg-rose-500";
}
function rankMedal(i: number): string {
  return ["text-amber-300", "text-zinc-300", "text-orange-300"][i] ?? "text-muted-foreground";
}

function JobDetailContent() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [tab, setTab] = useState<Tab>("applications");
  const [job, setJob] = useState<JobPost | null>(null);
  const [candidates, setCandidates] = useState<RankedCandidate[] | null>(null);
  const [applicants, setApplicants] = useState<RecruiterApplicant[] | null>(null);
  const [appView, setAppView] = useState<"list" | "board">("list");
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [inviting, setInviting] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    void getJob(id).then(setJob).catch(() => {});
    void getJobRanking(id)
      .then((r) => {
        setCandidates(r.candidates);
        setSaved(new Set(r.candidates.filter((c) => c.shortlisted).map((c) => c.id)));
      })
      .catch(() => setCandidates([]));
  }, [id]);

  useEffect(() => {
    if (tab === "applications" && applicants === null) {
      void getJobApplications(id).then(setApplicants).catch(() => setApplicants([]));
    }
  }, [tab, id, applicants]);

  function toggleOpen(cid: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(cid)) next.delete(cid);
      else next.add(cid);
      return next;
    });
  }

  async function toggleSave(cid: string) {
    const on = saved.has(cid);
    setSaved((prev) => {
      const next = new Set(prev);
      if (on) next.delete(cid);
      else next.add(cid);
      return next;
    });
    try {
      if (on) await removeShortlist(cid);
      else await addShortlist(cid);
    } catch {
      setSaved((prev) => {
        const next = new Set(prev);
        if (on) next.add(cid);
        else next.delete(cid);
        return next;
      });
    }
  }

  async function changeStatus(applicationId: string, status: ApplicationStatus) {
    await updateApplicationStatus(applicationId, status);
    syncStatus(applicationId, status);
  }

  // Reflect a status change that the server already made (e.g. via the
  // lifecycle panel scheduling an interview or sending an offer) — no extra call.
  function syncStatus(applicationId: string, status: ApplicationStatus) {
    setApplicants((prev) =>
      prev?.map((a) => (a.applicationId === applicationId ? { ...a, status } : a)) ?? prev,
    );
  }

  if (!candidates) return <LoadingScreen label="Loading job details…" />;

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-2.5">
        <button
          onClick={() => router.push("/recruiter/jobs")}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Back to jobs"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight">
            {job?.title ?? "Job details"}
          </h1>
          {job?.company && (
            <p className="text-sm text-muted-foreground">{job.company.name}</p>
          )}
        </div>
      </div>

      {job && job.skills.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {job.skills.map((s) => (
            <span key={s} className="rounded-full border border-border bg-secondary/50 px-2.5 py-0.5 text-xs">
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border border-border bg-secondary/30 p-1">
        {(
          [
            {
              key: "applications" as Tab,
              label: `Applications${job ? ` (${job.applicationCount})` : ""}`,
              icon: ClipboardList,
            },
            { key: "ranking" as Tab, label: "Ranked Candidates", icon: Trophy },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Ranking tab */}
      {tab === "ranking" &&
        (candidates.length === 0 ? (
          <div className="rounded-xl border border-border bg-card px-6 py-14 text-center">
            <ShieldCheck className="mx-auto h-7 w-7 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              No verified engineers match these skills yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {candidates.map((c, i) => (
              <RankedCard
                key={c.id}
                c={c}
                rank={i + 1}
                saved={saved.has(c.id)}
                open={open.has(c.id)}
                onToggleSave={() => toggleSave(c.id)}
                onToggleOpen={() => toggleOpen(c.id)}
                onMessage={() => setInviting({ id: c.id, name: c.name })}
              />
            ))}
          </div>
        ))}

      {/* Applications tab */}
      {tab === "applications" &&
        (applicants === null ? (
          <LoadingScreen label="Loading applications…" />
        ) : applicants.length === 0 ? (
          <div className="rounded-xl border border-border bg-card px-6 py-14 text-center">
            <Users className="mx-auto h-7 w-7 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">No applications yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="inline-flex rounded-lg border border-border bg-card p-1 text-sm">
              {(["list", "board"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setAppView(v)}
                  className={`rounded-md px-3 py-1.5 font-medium capitalize transition-colors ${
                    appView === v ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {v === "board" ? "Pipeline board" : "List"}
                </button>
              ))}
            </div>

            {appView === "list" ? (
              <div className="space-y-3">
                {applicants.map((a) => (
                  <ApplicantCard
                    key={a.applicationId}
                    applicant={a}
                    onStatusChange={changeStatus}
                    onSyncStatus={syncStatus}
                    onMessage={() => setInviting({ id: a.studentId, name: a.name ?? "candidate" })}
                  />
                ))}
              </div>
            ) : (
              <PipelineBoard applicants={applicants} onStatusChange={changeStatus} />
            )}
          </div>
        ))}

      {inviting && (
        <InviteCandidateModal candidateId={inviting.id} name={inviting.name} onClose={() => setInviting(null)} />
      )}
    </main>
  );
}

/** Trello-style hiring pipeline — drag applicant cards between stage columns. */
function PipelineBoard({
  applicants,
  onStatusChange,
}: {
  applicants: RecruiterApplicant[];
  onStatusChange: (id: string, status: ApplicationStatus) => Promise<void>;
}) {
  const [dragOver, setDragOver] = useState<ApplicationStatus | null>(null);

  function onDrop(e: React.DragEvent, status: ApplicationStatus) {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData("text/plain");
    const app = applicants.find((a) => a.applicationId === id);
    if (id && app && app.status !== status) void onStatusChange(id, status);
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {APPLICATION_STATUSES.map((col) => {
        const cards = applicants.filter((a) => a.status === col.value);
        return (
          <div
            key={col.value}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(col.value);
            }}
            onDragLeave={() => setDragOver((d) => (d === col.value ? null : d))}
            onDrop={(e) => onDrop(e, col.value)}
            className={`flex w-64 shrink-0 flex-col rounded-xl border bg-card/50 p-2 transition-colors ${
              dragOver === col.value ? "border-primary/50 bg-primary/5" : "border-border"
            }`}
          >
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className={`text-xs font-semibold ${col.color}`}>{col.label}</span>
              <span className="rounded-full bg-secondary px-1.5 text-[10px] text-muted-foreground">{cards.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {cards.map((a) => (
                <div
                  key={a.applicationId}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", a.applicationId)}
                  className="cursor-grab rounded-lg border border-border bg-card p-3 active:cursor-grabbing"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{a.name ?? "Candidate"}</span>
                    <span className={`text-xs font-bold ${matchColor(a.matchScore)}`}>{a.matchScore}%</span>
                  </div>
                  {a.headline && <p className="truncate text-xs text-muted-foreground">{a.headline}</p>}
                  <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className={scoreColor(a.dnaScore)}>DNA {a.dnaScore}</span>
                    {a.interviewScore !== null && <span>· Interview {a.interviewScore}</span>}
                  </div>
                </div>
              ))}
              {cards.length === 0 && (
                <p className="px-2 py-3 text-center text-[11px] text-muted-foreground">Drop here</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function matchColor(v: number): string {
  if (v >= 70) return "text-emerald-400";
  if (v >= 40) return "text-amber-400";
  return "text-rose-400";
}

/** Invite a candidate to chat (creates a pending conversation). */
function InviteCandidateModal({ candidateId, name, onClose }: { candidateId: string; name: string; onClose: () => void }) {
  const router = useRouter();
  const [message, setMessage] = useState(
    `Hi ${name.split(" ")[0]}, I'd like to connect with you about an opportunity on EngineerDNA.`,
  );
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function send() {
    if (!message.trim() || sending) return;
    setSending(true);
    try {
      await inviteCandidate(candidateId, message.trim());
      setSent(true);
    } catch {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        {sent ? (
          <div className="py-4 text-center">
            <p className="font-medium">Invitation sent</p>
            <p className="mt-1 text-sm text-muted-foreground">You&apos;ll be able to chat once they accept.</p>
            <div className="mt-4 flex justify-center gap-2">
              <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium">Close</button>
              <button onClick={() => router.push("/messages")} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">Go to messages</button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-start justify-between">
              <h2 className="text-lg font-bold">Message {name}</h2>
              <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
            />
            <button
              onClick={send}
              disabled={sending || !message.trim()}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessagesSquare className="h-4 w-4" />}
              Send invitation
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/** Integrity badge for a candidate's proctored mock interview. */
function IntegrityBadge({ p }: { p: ProctoringReport }) {
  const flags =
    p.fullscreenExits +
    p.tabSwitches +
    p.focusLost +
    p.noFaceEvents +
    p.multipleFaceEvents +
    p.lookAwayEvents +
    p.phoneEvents;
  if (p.terminated) {
    return (
      <span title="Auto-ended on repeated violations" className="rounded-full bg-rose-500/15 px-2 py-0.5 font-medium text-rose-300">
        Integrity: ended on violations
      </span>
    );
  }
  if (flags === 0) {
    return (
      <span title="No violations detected" className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-medium text-emerald-300">
        Integrity: clean
      </span>
    );
  }
  return (
    <span
      title={`${p.fullscreenExits} fullscreen exits · ${p.tabSwitches} tab switches · ${p.focusLost} window leaves · ${p.noFaceEvents} no-face · ${p.multipleFaceEvents} multiple-face · ${p.lookAwayEvents} looked-away · ${p.phoneEvents} phone`}
      className="rounded-full bg-amber-500/15 px-2 py-0.5 font-medium text-amber-300"
    >
      Integrity: {flags} flag{flags === 1 ? "" : "s"}
    </span>
  );
}

function ApplicantCard({
  applicant: a,
  onStatusChange,
  onSyncStatus,
  onMessage,
}: {
  applicant: RecruiterApplicant;
  onStatusChange: (id: string, status: ApplicationStatus) => Promise<void>;
  onSyncStatus: (id: string, status: ApplicationStatus) => void;
  onMessage: () => void;
}) {
  const [statusOpen, setStatusOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [hiringOpen, setHiringOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const statusInfo = APPLICATION_STATUSES.find((s) => s.value === a.status);

  async function change(status: ApplicationStatus) {
    setLoading(true);
    try {
      await onStatusChange(a.applicationId, status);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      {/* Top row */}
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
          {(a.name ?? a.email).charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">{a.name ?? "Candidate"}</p>
            <span className={`text-xs font-medium ${statusInfo?.color ?? "text-muted-foreground"}`}>
              {statusInfo?.label ?? a.status}
            </span>
          </div>
          {a.headline && <p className="truncate text-sm text-muted-foreground">{a.headline}</p>}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {a.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {a.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> {a.verifiedSkillCount} verified
            </span>
            <span className={`font-medium ${scoreColor(a.dnaScore)}`}>DNA {a.dnaScore}</span>
            {!a.hasResume && <span className="text-amber-400">No resume</span>}
          </div>
        </div>
        {/* Match score is the headline number */}
        <div className="text-right">
          <p className={`text-3xl font-bold tabular-nums ${matchColor(a.matchScore)}`}>{a.matchScore}%</p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">job match</p>
        </div>
      </div>

      {/* Skill coverage chips */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {a.evidenceSkills.map((s) => (
          <span
            key={`e-${s}`}
            title="Proven in their repositories"
            className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300"
          >
            {s} ✓
          </span>
        ))}
        {a.resumeSkills
          .filter((s) => !a.evidenceSkills.includes(s))
          .map((s) => (
            <span
              key={`r-${s}`}
              title="Mentioned in their resume (not yet proven in code)"
              className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-300"
            >
              {s} · resume
            </span>
          ))}
        {a.missingSkills.map((s) => (
          <span
            key={`m-${s}`}
            title="No evidence or resume mention"
            className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground line-through"
          >
            {s}
          </span>
        ))}
      </div>

      {/* Mock interview signal + integrity */}
      {a.interviewScore !== null && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-secondary/30 px-3 py-2 text-xs">
          <span className="flex items-center gap-1.5 font-medium">
            <MessagesSquare className="h-3.5 w-3.5 text-primary" />
            Mock interview <span className={`font-bold ${scoreColor(a.interviewScore)}`}>{a.interviewScore}/100</span>
          </span>
          {a.interviewIntegrity && <IntegrityBadge p={a.interviewIntegrity} />}
        </div>
      )}

      {/* Cover letter */}
      {a.coverLetter && (
        <div className="mt-3 rounded-lg border border-border bg-secondary/30 p-3 text-sm text-muted-foreground">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide">Cover letter</p>
          <p className="line-clamp-3">{a.coverLetter}</p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setReportOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <FileSearch className="h-3.5 w-3.5" />
          Evidence report
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${reportOpen ? "rotate-180" : ""}`} />
        </button>
        {a.githubUsername && (
          <a
            href={`https://github.com/${a.githubUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <Github className="h-3.5 w-3.5" /> GitHub
          </a>
        )}
        {a.portfolioSlug && (
          <a
            href={`/p/${a.portfolioSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Portfolio
          </a>
        )}
        <button
          onClick={() => setHiringOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
        >
          <CalendarClock className="h-3.5 w-3.5" />
          Manage hiring
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${hiringOpen ? "rotate-180" : ""}`} />
        </button>
        <button
          onClick={onMessage}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
        >
          <MessagesSquare className="h-3.5 w-3.5" /> Message
        </button>
        <button
          onClick={() => setStatusOpen((v) => !v)}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          Change status
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${statusOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {statusOpen && (
        <div className="mt-2 flex flex-wrap gap-2">
          {APPLICATION_STATUSES.filter((s) => s.value !== a.status).map((s) => (
            <button
              key={s.value}
              onClick={async () => {
                await change(s.value);
                setStatusOpen(false);
              }}
              className={`rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:bg-accent ${s.color}`}
            >
              → {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Evidence report — the proof behind the match */}
      {reportOpen && (
        <div className="mt-3 space-y-3 border-t border-border pt-3">
          <p className="text-xs text-muted-foreground">
            <span className={`font-semibold ${matchColor(a.matchScore)}`}>{a.matchScore}% match</span>{" "}
            = proven skills (70%) + resume keywords (30%). Evidence is verified from real public
            repositories — no black box.
          </p>

          {a.matchedRepos.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Where they used the required skills
              </p>
              {a.matchedRepos.map((r) => (
                <a
                  key={r.name}
                  href={r.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg border border-border px-3 py-2 transition-colors hover:border-primary/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      <FolderGit2 className="h-3.5 w-3.5 text-muted-foreground" />
                      {r.name}
                    </span>
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      {r.language && <span>{r.language}</span>}
                      {r.stars > 0 && <span>★ {r.stars}</span>}
                      <ExternalLink className="h-3 w-3" />
                    </span>
                  </div>
                  {r.description && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{r.description}</p>
                  )}
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {r.skills.map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              No public repositories prove the required skills yet
              {a.resumeSkills.length > 0 ? " — matched on resume keywords only." : "."}
            </p>
          )}
        </div>
      )}

      {/* Hiring lifecycle — schedule interviews, send offers, view the timeline */}
      {hiringOpen && (
        <div className="mt-3 border-t border-border pt-3">
          <LifecyclePanel
            applicationId={a.applicationId}
            role="recruiter"
            onChange={(life) => onSyncStatus(a.applicationId, life.status)}
          />
        </div>
      )}
    </div>
  );
}

function RankedCard({
  c,
  rank,
  saved,
  open,
  onToggleSave,
  onToggleOpen,
  onMessage,
}: {
  c: RankedCandidate;
  rank: number;
  saved: boolean;
  open: boolean;
  onToggleSave: () => void;
  onToggleOpen: () => void;
  onMessage: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start gap-4">
        <div className="flex w-8 shrink-0 flex-col items-center">
          <span className={`text-lg font-bold tabular-nums ${rankMedal(rank - 1)}`}>#{rank}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium">{c.name}</p>
          </div>
          {c.headline && <p className="truncate text-sm text-muted-foreground">{c.headline}</p>}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {c.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {c.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> {c.verifiedSkillCount} verified
            </span>
            {c.interviewScore != null && (
              <span className="flex items-center gap-1">
                <MessagesSquare className="h-3 w-3" /> Interview {c.interviewScore}/100
              </span>
            )}
          </div>
          {c.matchedSkills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {c.matchedSkills.map((s) => (
                <span key={s} className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300">
                  {s} ✓
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="text-right">
          <p className={`text-3xl font-bold tabular-nums ${scoreColor(c.rankScore)}`}>{c.rankScore}</p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">rank score</p>
          {c.matchedSkills.length > 0 && (
            <p className="mt-0.5 text-xs font-medium text-emerald-400">{c.matchScore}% match</p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={onToggleOpen}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Why this rank
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        <button
          onClick={onMessage}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <MessagesSquare className="h-4 w-4" /> Message
        </button>
        <button
          onClick={onToggleSave}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
            saved ? "border-primary/40 bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          {saved ? "Shortlisted" : "Shortlist"}
        </button>
      </div>

      {open && (
        <div className="mt-3 space-y-3 border-t border-border pt-3">
          {c.factors.map((f) => (
            <div key={f.key}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium">{f.label}</span>
                <span className="text-xs text-muted-foreground">
                  <span className="tabular-nums">{f.score}</span> × {Math.round(f.weight * 100)}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className={`h-full rounded-full ${barColor(f.score)}`} style={{ width: `${f.score}%` }} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{f.detail}</p>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Rank score is the weighted sum of these factors — all from verified evidence, no black box.
          </p>
        </div>
      )}
    </div>
  );
}

export default function JobDetailPage() {
  return (
    <RecruiterGate>
      <JobDetailContent />
    </RecruiterGate>
  );
}
