"use client";

import { useEffect, useState } from "react";
import {
  CalendarClock,
  Check,
  CheckCircle2,
  CircleDot,
  ExternalLink,
  FileText,
  Gift,
  Loader2,
  Send,
  X,
  XCircle,
} from "lucide-react";
import type { ApplicationEvent, ApplicationLifecycle, ScheduleInterviewInput, SendOfferInput } from "@engineerdna/shared";
import { JOB_TYPES } from "@engineerdna/shared";
import {
  getApplicationTimeline,
  respondInterview,
  respondOffer,
  scheduleInterview,
  sendOffer,
} from "@/services/applications";

type Role = "recruiter" | "student";

function eventLabel(e: ApplicationEvent): string {
  switch (e.type) {
    case "applied":
      return "Application submitted";
    case "status_changed":
      return `Stage updated → ${e.note ?? ""}`.trim();
    case "interview_scheduled":
      return `Interview proposed${e.note ? ` · ${e.note}` : ""}`;
    case "interview_accepted":
      return "Candidate accepted the interview";
    case "interview_declined":
      return "Candidate declined the interview";
    case "offer_sent":
      return `Offer sent${e.note ? ` · ${e.note}` : ""}`;
    case "offer_accepted":
      return "Candidate accepted the offer";
    case "offer_rejected":
      return "Candidate declined the offer";
    default:
      return e.type.replace(/_/g, " ");
  }
}

function eventIcon(type: string) {
  if (type.startsWith("interview")) return CalendarClock;
  if (type.startsWith("offer")) return Gift;
  if (type === "applied") return FileText;
  return CircleDot;
}

function fmt(dt: string): string {
  return new Date(dt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export function LifecyclePanel({
  applicationId,
  role,
  onChange,
}: {
  applicationId: string;
  role: Role;
  onChange?: (life: ApplicationLifecycle) => void;
}) {
  const [life, setLife] = useState<ApplicationLifecycle | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<null | "interview" | "offer">(null);

  const apply = (next: ApplicationLifecycle) => {
    setLife(next);
    onChange?.(next);
  };

  useEffect(() => {
    let active = true;
    getApplicationTimeline(applicationId)
      .then((l) => active && setLife(l))
      .catch(() => {})
      .finally(() => active && setLoaded(true));
    return () => {
      active = false;
    };
  }, [applicationId]);

  const run = async (fn: () => Promise<ApplicationLifecycle>) => {
    setBusy(true);
    try {
      apply(await fn());
      setForm(null);
    } catch {
      /* best-effort; surfaced inline */
    } finally {
      setBusy(false);
    }
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }
  if (!life) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Could not load the timeline.</p>;
  }

  const { interview, offer, timeline } = life;
  const jobTypeLabel = (v: string) => JOB_TYPES.find((t) => t.value === v)?.label ?? v;

  return (
    <div className="space-y-4">
      {/* Interview card */}
      {interview && (
        <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm font-semibold text-cyan-300">
              <CalendarClock className="h-4 w-4" /> Interview
            </span>
            <StatusPill status={interview.status} />
          </div>
          <p className="mt-2 text-sm">{fmt(interview.scheduledAt)}</p>
          {interview.meetingLink && (
            <a
              href={interview.meetingLink}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Join link <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {interview.notes && <p className="mt-1 text-xs text-muted-foreground">{interview.notes}</p>}
          {role === "student" && interview.status === "PROPOSED" && (
            <div className="mt-3 flex gap-2">
              <button
                disabled={busy}
                onClick={() => run(() => respondInterview(applicationId, "accept"))}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" /> Accept
              </button>
              <button
                disabled={busy}
                onClick={() => run(() => respondInterview(applicationId, "decline"))}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" /> Decline
              </button>
            </div>
          )}
        </div>
      )}

      {/* Offer card */}
      {offer && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm font-semibold text-amber-300">
              <Gift className="h-4 w-4" /> Offer
            </span>
            <StatusPill status={offer.status} />
          </div>
          <p className="mt-2 text-sm font-semibold">{offer.salary}</p>
          <p className="text-xs text-muted-foreground">
            {jobTypeLabel(offer.employmentType)}
            {offer.joiningDate ? ` · Joins ${new Date(offer.joiningDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : ""}
          </p>
          {offer.message && <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">{offer.message}</p>}
          {role === "student" && offer.status === "SENT" && (
            <div className="mt-3 flex gap-2">
              <button
                disabled={busy}
                onClick={() => run(() => respondOffer(applicationId, "accept"))}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" /> Accept offer
              </button>
              <button
                disabled={busy}
                onClick={() => run(() => respondOffer(applicationId, "reject"))}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" /> Decline
              </button>
            </div>
          )}
        </div>
      )}

      {/* Recruiter actions */}
      {role === "recruiter" && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setForm(form === "interview" ? null : "interview")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition-colors hover:bg-cyan-500/20"
          >
            <CalendarClock className="h-3.5 w-3.5" /> {interview ? "Reschedule" : "Schedule interview"}
          </button>
          <button
            onClick={() => setForm(form === "offer" ? null : "offer")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-500/20"
          >
            <Gift className="h-3.5 w-3.5" /> {offer ? "Revise offer" : "Send offer"}
          </button>
        </div>
      )}

      {role === "recruiter" && form === "interview" && (
        <InterviewForm busy={busy} onCancel={() => setForm(null)} onSubmit={(input) => run(() => scheduleInterview(applicationId, input))} />
      )}
      {role === "recruiter" && form === "offer" && (
        <OfferForm busy={busy} onCancel={() => setForm(null)} onSubmit={(input) => run(() => sendOffer(applicationId, input))} />
      )}

      {/* Timeline */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Timeline</p>
        {timeline.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <ol className="relative space-y-3 border-l border-border pl-4">
            {[...timeline].reverse().map((e) => {
              const Icon = eventIcon(e.type);
              return (
                <li key={e.id} className="relative">
                  <span className="absolute -left-[1.42rem] flex h-5 w-5 items-center justify-center rounded-full bg-card ring-1 ring-border">
                    <Icon className="h-3 w-3 text-primary" />
                  </span>
                  <p className="text-sm">{eventLabel(e)}</p>
                  <p className="text-[11px] text-muted-foreground">{fmt(e.createdAt)}</p>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; Icon: typeof Check }> = {
    PROPOSED: { label: "Awaiting response", cls: "bg-cyan-500/15 text-cyan-300", Icon: CircleDot },
    SENT: { label: "Awaiting response", cls: "bg-amber-500/15 text-amber-300", Icon: CircleDot },
    ACCEPTED: { label: "Accepted", cls: "bg-emerald-500/15 text-emerald-300", Icon: CheckCircle2 },
    DECLINED: { label: "Declined", cls: "bg-rose-500/15 text-rose-300", Icon: XCircle },
    REJECTED: { label: "Declined", cls: "bg-rose-500/15 text-rose-300", Icon: XCircle },
  };
  const m = map[status] ?? { label: status, cls: "bg-muted text-muted-foreground", Icon: CircleDot };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${m.cls}`}>
      <m.Icon className="h-3 w-3" /> {m.label}
    </span>
  );
}

function InterviewForm({
  busy,
  onCancel,
  onSubmit,
}: {
  busy: boolean;
  onCancel: () => void;
  onSubmit: (input: ScheduleInterviewInput) => void;
}) {
  const [when, setWhen] = useState("");
  const [link, setLink] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!when) return;
        onSubmit({
          scheduledAt: new Date(when).toISOString(),
          meetingLink: link.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      }}
      className="space-y-3 rounded-xl border border-border bg-muted/30 p-4"
    >
      <Field label="Date & time">
        <input
          type="datetime-local"
          required
          value={when}
          onChange={(e) => setWhen(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </Field>
      <Field label="Meeting link (optional)">
        <input
          type="url"
          placeholder="https://meet.google.com/…"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </Field>
      <Field label="Notes (optional)">
        <textarea
          rows={2}
          placeholder="What to prepare, who they'll meet…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </Field>
      <FormActions busy={busy} onCancel={onCancel} submitLabel="Send invitation" Icon={Send} />
    </form>
  );
}

function OfferForm({
  busy,
  onCancel,
  onSubmit,
}: {
  busy: boolean;
  onCancel: () => void;
  onSubmit: (input: SendOfferInput) => void;
}) {
  const [salary, setSalary] = useState("");
  const [joining, setJoining] = useState("");
  const [type, setType] = useState<SendOfferInput["employmentType"]>("FULL_TIME");
  const [message, setMessage] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!salary.trim()) return;
        onSubmit({
          salary: salary.trim(),
          joiningDate: joining ? new Date(joining).toISOString() : undefined,
          employmentType: type,
          message: message.trim() || undefined,
        });
      }}
      className="space-y-3 rounded-xl border border-border bg-muted/30 p-4"
    >
      <Field label="Compensation">
        <input
          required
          placeholder="₹18 LPA · or $120k"
          value={salary}
          onChange={(e) => setSalary(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Employment type">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as SendOfferInput["employmentType"])}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {JOB_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Joining date (optional)">
          <input
            type="date"
            value={joining}
            onChange={(e) => setJoining(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </Field>
      </div>
      <Field label="Message (optional)">
        <textarea
          rows={2}
          placeholder="A personal note to the candidate…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </Field>
      <FormActions busy={busy} onCancel={onCancel} submitLabel="Send offer" Icon={Gift} />
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function FormActions({
  busy,
  onCancel,
  submitLabel,
  Icon,
}: {
  busy: boolean;
  onCancel: () => void;
  submitLabel: string;
  Icon: typeof Send;
}) {
  return (
    <div className="flex justify-end gap-2 pt-1">
      <button type="button" onClick={onCancel} className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
        Cancel
      </button>
      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />} {submitLabel}
      </button>
    </div>
  );
}
