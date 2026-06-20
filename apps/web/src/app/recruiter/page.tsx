"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  Github,
  GraduationCap,
  Loader2,
  MapPin,
  MessagesSquare,
  Plus,
  Search,
  ShieldCheck,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { SEARCHABLE_SKILLS, type CandidateSummary, type RecruiterDashboard } from "@engineerdna/shared";
import { RecruiterGate } from "@/components/recruiter/RecruiterGate";
import { Pagination } from "@/components/ui/Pagination";
import { usePagination } from "@/hooks/usePagination";
import {
  addShortlist,
  getRecruiterDashboard,
  getShortlist,
  removeShortlist,
  searchCandidates,
} from "@/services/recruiter";
import { inviteCandidate } from "@/services/messaging";

const SUGGESTIONS = ["React", "Node.js", "TypeScript", "PostgreSQL", "Docker", "AWS", "Redis", "Spring Boot", "Kafka", "Kubernetes"];

function scoreColor(v: number): string {
  if (v >= 75) return "text-emerald-400";
  if (v >= 50) return "text-amber-400";
  return "text-rose-400";
}

/** Headline counts across the recruiter's hiring activity. */
function RecruiterStatsStrip() {
  const [stats, setStats] = useState<RecruiterDashboard | null>(null);
  useEffect(() => {
    getRecruiterDashboard().then(setStats).catch(() => {});
  }, []);
  if (!stats) return null;
  const cards = [
    { label: "Active jobs", value: stats.activeJobs, icon: Briefcase },
    { label: "Applicants", value: stats.totalApplicants, icon: Users },
    { label: "Shortlisted", value: stats.shortlisted, icon: Bookmark },
    { label: "Interviews", value: stats.interviews, icon: MessagesSquare },
    { label: "Hires", value: stats.hires, icon: Trophy },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-border bg-card p-4">
          <c.icon className="h-4 w-4 text-primary" />
          <p className="mt-2 text-2xl font-bold tabular-nums">{c.value}</p>
          <p className="text-xs text-muted-foreground">{c.label}</p>
        </div>
      ))}
    </div>
  );
}

function RecruiterContent() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Users className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Find Talent</h1>
          <p className="text-sm text-muted-foreground">
            Search verified engineers by real, evidence-backed skills — not resumes.
          </p>
        </div>
      </div>
      <Dashboard />
    </main>
  );
}

function Dashboard() {
  const [tab, setTab] = useState<"search" | "shortlist">("search");
  const [skills, setSkills] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [results, setResults] = useState<CandidateSummary[] | null>(null);
  const [shortlist, setShortlist] = useState<CandidateSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [inviting, setInviting] = useState<CandidateSummary | null>(null);
  const router = useRouter();

  const addSkill = (s: string) => {
    const v = s.trim();
    if (v && !skills.some((k) => k.toLowerCase() === v.toLowerCase())) setSkills((p) => [...p, v]);
    setInput("");
  };

  const seedSaved = useCallback((list: CandidateSummary[]) => {
    setSaved((prev) => {
      const next = new Set(prev);
      list.forEach((c) => (c.shortlisted ? next.add(c.id) : null));
      return next;
    });
  }, []);

  async function runSearch() {
    setSearching(true);
    try {
      const res = await searchCandidates({ skills });
      setResults(res.candidates);
      seedSaved(res.candidates);
    } finally {
      setSearching(false);
    }
  }

  const loadShortlist = useCallback(async () => {
    const res = await getShortlist();
    setShortlist(res.candidates);
    seedSaved(res.candidates);
  }, [seedSaved]);

  useEffect(() => {
    if (tab === "shortlist") void loadShortlist();
  }, [tab, loadShortlist]);

  async function toggleSave(id: string) {
    const on = saved.has(id);
    setSaved((prev) => {
      const next = new Set(prev);
      if (on) next.delete(id);
      else next.add(id);
      return next;
    });
    try {
      if (on) await removeShortlist(id);
      else await addShortlist(id);
      if (tab === "shortlist") void loadShortlist();
    } catch {
      // revert on failure
      setSaved((prev) => {
        const next = new Set(prev);
        if (on) next.add(id);
        else next.delete(id);
        return next;
      });
    }
  }

  const list = tab === "search" ? results : shortlist;
  const paged = usePagination(list ?? [], 10);

  const q = input.trim().toLowerCase();
  const suggestions = q
    ? SEARCHABLE_SKILLS.filter(
        (s) => s.toLowerCase().includes(q) && !skills.some((k) => k.toLowerCase() === s.toLowerCase()),
      ).slice(0, 10)
    : [];

  return (
    <div className="mt-6 space-y-4">
      <RecruiterStatsStrip />

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-card p-1 text-sm">
        {(["search", "shortlist"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md px-3 py-1.5 font-medium transition-colors ${
              tab === t ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "search" ? "Search" : `Shortlist${shortlist.length ? ` (${shortlist.length})` : ""}`}
          </button>
        ))}
      </div>

      {tab === "search" && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="relative flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
            {skills.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {s}
                <button onClick={() => setSkills((p) => p.filter((k) => k !== s))} aria-label={`Remove ${s}`}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addSkill(input);
                }
              }}
              placeholder={skills.length ? "Add another skill…" : "e.g. Spring Boot, Redis, AWS…"}
              className="min-w-[8rem] flex-1 bg-transparent text-sm outline-none"
            />
            <button
              onClick={runSearch}
              disabled={searching}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search
            </button>

            {/* Skill autocomplete — pick from a curated vocabulary, no guessing. */}
            {suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-lg border border-border bg-card py-1 shadow-xl">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      addSkill(s);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:bg-accent"
                  >
                    <Plus className="h-3.5 w-3.5 text-muted-foreground" /> {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {SUGGESTIONS.filter((s) => !skills.includes(s)).map((s) => (
              <button
                key={s}
                onClick={() => addSkill(s)}
                className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              >
                <Plus className="h-3 w-3" /> {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {list === null ? (
        <Empty icon={Search} text="Add skills and hit Search to find verified engineers." />
      ) : list.length === 0 ? (
        <Empty
          icon={tab === "search" ? Search : Bookmark}
          text={
            tab === "search"
              ? "No verified candidates match these skills yet. Candidates appear once they connect GitHub and build evidence from their public repositories."
              : "Your shortlist is empty. Bookmark candidates from Search."
          }
        />
      ) : (
        <div className="space-y-3">
          {paged.pageItems.map((c) => (
            <CandidateCard
              key={c.id}
              c={c}
              saved={saved.has(c.id)}
              onToggleSave={() => toggleSave(c.id)}
              onView={() => router.push(`/recruiter/candidates/${c.id}`)}
              onMessage={() => setInviting(c)}
            />
          ))}
          <Pagination
            page={paged.page}
            totalPages={paged.totalPages}
            onPageChange={paged.setPage}
            from={paged.from}
            to={paged.to}
            total={paged.total}
            label="candidates"
          />
        </div>
      )}

      {inviting && <InviteModal candidate={inviting} onClose={() => setInviting(null)} />}
    </div>
  );
}

/** Send a connection request to a candidate (creates a pending conversation). */
function InviteModal({ candidate, onClose }: { candidate: CandidateSummary; onClose: () => void }) {
  const router = useRouter();
  const [message, setMessage] = useState(
    `Hi ${candidate.name?.split(" ")[0] ?? "there"}, I came across your verified profile on EngineerDNA and would love to connect about an opportunity.`,
  );
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function send() {
    if (!message.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      await inviteCandidate(candidate.id, message.trim());
      setSent(true);
    } catch {
      setError("Couldn't send the invitation. Please try again.");
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold">Message {candidate.name ?? "candidate"}</h2>
            <p className="text-xs text-muted-foreground">They&apos;ll chat with you once they accept.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {sent ? (
          <div className="py-4 text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <BookmarkCheck className="h-5 w-5" />
            </span>
            <p className="mt-3 font-medium">Invitation sent</p>
            <p className="mt-1 text-sm text-muted-foreground">You&apos;ll be able to chat once they accept.</p>
            <div className="mt-4 flex justify-center gap-2">
              <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium">Close</button>
              <button onClick={() => router.push("/messages")} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">Go to messages</button>
            </div>
          </div>
        ) : (
          <>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
            />
            {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
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

function CandidateCard({
  c,
  saved,
  onToggleSave,
  onView,
  onMessage,
}: {
  c: CandidateSummary;
  saved: boolean;
  onToggleSave: () => void;
  onView: () => void;
  onMessage: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <Avatar name={c.name} image={c.profileImage} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium">{c.name}</p>
            <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />
          </div>
          {c.headline && <p className="truncate text-sm text-muted-foreground">{c.headline}</p>}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {c.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {c.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> {c.verifiedSkillCount} verified skills
            </span>
            <span className="flex items-center gap-1">
              <Github className="h-3 w-3" /> {c.publicRepoCount} public repos
            </span>
            {c.college && (
              <span className="flex items-center gap-1">
                <GraduationCap className="h-3 w-3" /> {c.college}
              </span>
            )}
            {c.experienceYears != null && <span>{c.experienceYears} yr exp</span>}
            {c.availability && <span className="text-emerald-400">{c.availability}</span>}
            {c.expectedSalary && <span>{c.expectedSalary}</span>}
          </div>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold tabular-nums ${scoreColor(c.overall)}`}>{c.overall}</p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">DNA score</p>
        </div>
      </div>

      {c.matchedSkills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {c.matchedSkills.map((s) => (
            <span key={s} className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300">
              {s} ✓
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={onView}
          className="rounded-lg bg-brand px-3.5 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          View profile
        </button>
        <button
          onClick={onMessage}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
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
    </div>
  );
}

function Avatar({ name, image }: { name: string; image: string | null }) {
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt={name} className="h-11 w-11 shrink-0 rounded-full object-cover" />;
  }
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function Empty({ icon: Icon, text }: { icon: typeof Search; text: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-6 py-14 text-center">
      <Icon className="mx-auto h-7 w-7 text-muted-foreground" />
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

export default function RecruiterPage() {
  return (
    <RecruiterGate>
      <RecruiterContent />
    </RecruiterGate>
  );
}
