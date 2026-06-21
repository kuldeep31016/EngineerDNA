"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Bookmark,
  BookmarkCheck,
  Clock,
  ExternalLink,
  Github,
  GraduationCap,
  Globe,
  Loader2,
  MapPin,
  MessagesSquare,
  ShieldCheck,
  Star,
  Wallet,
} from "lucide-react";
import type { CandidateProfile } from "@engineerdna/shared";
import { RecruiterGate } from "@/components/recruiter/RecruiterGate";
import { CandidateNoteCard } from "@/components/recruiter/CandidateNoteCard";
import { getCandidate, addShortlist, removeShortlist } from "@/services/recruiter";
import { inviteCandidate } from "@/services/messaging";

function scoreColor(v: number): string {
  if (v >= 75) return "text-emerald-400";
  if (v >= 50) return "text-amber-400";
  return "text-rose-400";
}

function CandidateProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [c, setC] = useState<CandidateProfile | null>(null);
  const [missing, setMissing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    getCandidate(params.id)
      .then((p) => {
        setC(p);
        setSaved(p.shortlisted);
      })
      .catch(() => setMissing(true));
  }, [params.id]);

  async function toggleSave() {
    if (!c) return;
    const next = !saved;
    setSaved(next);
    try {
      if (next) await addShortlist(c.id);
      else await removeShortlist(c.id);
    } catch {
      setSaved(!next);
    }
  }

  if (missing) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 text-center">
        <p className="text-lg font-semibold">Candidate not found</p>
        <p className="mt-1 text-sm text-muted-foreground">This profile is private or doesn&apos;t exist.</p>
      </main>
    );
  }
  if (!c) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </main>
    );
  }

  const meta = [
    c.location && { icon: MapPin, text: c.location },
    c.college && { icon: GraduationCap, text: c.college },
    c.experienceYears != null && { icon: Clock, text: `${c.experienceYears} yr${c.experienceYears === 1 ? "" : "s"} experience` },
    c.availability && { icon: Clock, text: c.availability },
    c.expectedSalary && { icon: Wallet, text: c.expectedSalary },
  ].filter(Boolean) as { icon: typeof MapPin; text: string }[];

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <button
        onClick={() => router.back()}
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Header */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-card p-6">
        <div className="flex flex-wrap items-start gap-4">
          {c.profileImage ? (
            <img src={c.profileImage} alt={c.name} className="h-16 w-16 rounded-2xl object-cover" />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-bold text-primary">
              {c.name.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{c.name}</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300">
                <BadgeCheck className="h-3 w-3" /> Verified
              </span>
            </div>
            {c.headline && <p className="text-sm text-muted-foreground">{c.headline}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {meta.map((m, i) => (
                <span key={i} className="flex items-center gap-1">
                  <m.icon className="h-3.5 w-3.5" /> {m.text}
                </span>
              ))}
            </div>
          </div>
          <div className="text-right">
            <p className={`text-3xl font-bold tabular-nums ${scoreColor(c.overall)}`}>{c.overall}</p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Evidence score</p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setInviteOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <MessagesSquare className="h-4 w-4" /> Message
          </button>
          <button
            onClick={toggleSave}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors ${
              saved ? "border-primary/40 bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            {saved ? "Shortlisted" : "Shortlist"}
          </button>
          {c.githubUsername && (
            <a href={`https://github.com/${c.githubUsername}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-sm text-muted-foreground hover:text-foreground">
              <Github className="h-4 w-4" /> GitHub
            </a>
          )}
          {c.portfolioSlug && (
            <a href={`/p/${c.portfolioSlug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-sm text-muted-foreground hover:text-foreground">
              <Globe className="h-4 w-4" /> Portfolio
            </a>
          )}
        </div>
      </div>

      <div className="mt-4">
        <CandidateNoteCard candidateId={c.id} />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {c.about && (
          <Section title="Summary" className="md:col-span-2">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{c.about}</p>
          </Section>
        )}

        {/* Verified skills */}
        <Section title="Verified skills" className="md:col-span-2">
          {c.verifiedSkills.length === 0 ? (
            <p className="text-sm text-muted-foreground">No verified skills yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {c.verifiedSkills.map((s) => (
                <span key={s.technology} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/20">
                  <BadgeCheck className="h-3 w-3" /> {s.technology}
                  <span className="text-emerald-300/60">· {s.repositoryCount}</span>
                </span>
              ))}
            </div>
          )}
        </Section>

        {/* Developer DNA */}
        <Section title="Developer DNA">
          <div className="space-y-2.5">
            {c.scores.slice(0, 6).map((s) => (
              <div key={s.key}>
                <div className="flex items-center justify-between text-xs">
                  <span>{s.label}</span>
                  <span className={`font-medium tabular-nums ${scoreColor(s.value)}`}>{s.value}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${s.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Interview */}
        <Section title="Interview">
          {c.interviewScore == null ? (
            <p className="text-sm text-muted-foreground">No completed mock interview.</p>
          ) : (
            <div>
              <p className={`text-3xl font-bold tabular-nums ${scoreColor(c.interviewScore)}`}>
                {c.interviewScore}
                <span className="text-base text-muted-foreground">/100</span>
              </p>
              {c.interviewIntegrity && (
                <p className="mt-1 inline-flex items-center gap-1 text-xs">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  {c.interviewIntegrity.terminated
                    ? "Integrity: ended on violations"
                    : c.interviewIntegrity.fullscreenExits + c.interviewIntegrity.tabSwitches + c.interviewIntegrity.focusLost + c.interviewIntegrity.noFaceEvents + c.interviewIntegrity.multipleFaceEvents + c.interviewIntegrity.lookAwayEvents + c.interviewIntegrity.phoneEvents === 0
                      ? "Integrity: clean"
                      : "Integrity: flagged"}
                </p>
              )}
            </div>
          )}
        </Section>

        {/* Projects */}
        {c.projects.length > 0 && (
          <Section title="Projects" className="md:col-span-2">
            <div className="grid gap-2 sm:grid-cols-2">
              {c.projects.map((p) => (
                <div key={p.name} className="rounded-lg border border-border bg-background/40 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{p.name}</span>
                    {p.url && (
                      <a href={p.url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                  {p.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Top repositories */}
        {c.topRepos.length > 0 && (
          <Section title="Top repositories" className="md:col-span-2">
            <div className="space-y-2">
              {c.topRepos.map((r) => (
                <a key={r.name} href={r.htmlUrl} target="_blank" rel="noreferrer" className="block rounded-lg border border-border px-3 py-2 transition-colors hover:border-primary/40">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      <Github className="h-3.5 w-3.5 text-muted-foreground" /> {r.name}
                    </span>
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      {r.language && <span>{r.language}</span>}
                      {r.stars > 0 && <span className="flex items-center gap-1"><Star className="h-3 w-3" /> {r.stars}</span>}
                      <ExternalLink className="h-3 w-3" />
                    </span>
                  </div>
                  {r.description && <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{r.description}</p>}
                </a>
              ))}
            </div>
          </Section>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Based on verified evidence — public repositories and proven skills only. No private repos, no unverified claims.
      </p>

      {inviteOpen && <InviteModal candidateId={c.id} name={c.name} onClose={() => setInviteOpen(false)} />}
    </main>
  );
}

function Section({ title, className, children }: { title: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-xl border border-border bg-card p-5 ${className ?? ""}`}>
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function InviteModal({ candidateId, name, onClose }: { candidateId: string; name: string; onClose: () => void }) {
  const router = useRouter();
  const [message, setMessage] = useState(
    `Hi ${name.split(" ")[0]}, I came across your verified profile on EngineerDNA and would love to connect about an opportunity.`,
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
            <h2 className="text-lg font-bold">Message {name}</h2>
            <p className="text-xs text-muted-foreground">They&apos;ll chat with you once they accept.</p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="mt-3 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
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

export default function Page() {
  return (
    <RecruiterGate>
      <CandidateProfilePage />
    </RecruiterGate>
  );
}
