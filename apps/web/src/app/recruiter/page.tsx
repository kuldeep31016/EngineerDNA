"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BadgeCheck,
  Bookmark,
  BookmarkCheck,
  Building2,
  Github,
  Loader2,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  X,
} from "lucide-react";
import type { CandidateProfile, CandidateSummary } from "@engineerdna/shared";
import { RecruiterGate } from "@/components/recruiter/RecruiterGate";
import { Pagination } from "@/components/ui/Pagination";
import { usePagination } from "@/hooks/usePagination";
import {
  addShortlist,
  getCandidate,
  getShortlist,
  removeShortlist,
  searchCandidates,
} from "@/services/recruiter";

const SUGGESTIONS = ["React", "Node.js", "TypeScript", "PostgreSQL", "Docker", "AWS", "Redis", "Spring Boot", "Kafka", "Kubernetes"];

function scoreColor(v: number): string {
  if (v >= 75) return "text-emerald-400";
  if (v >= 50) return "text-amber-400";
  return "text-rose-400";
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
  const [detailId, setDetailId] = useState<string | null>(null);

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

  return (
    <div className="mt-6 space-y-4">
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
              ? "No verified candidates match yet. Candidates appear once they make their passport public and build evidence."
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
              onView={() => setDetailId(c.id)}
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

      {detailId && (
        <CandidateDrawer
          id={detailId}
          saved={saved.has(detailId)}
          onToggleSave={() => toggleSave(detailId)}
          onClose={() => setDetailId(null)}
        />
      )}
    </div>
  );
}

function CandidateCard({
  c,
  saved,
  onToggleSave,
  onView,
}: {
  c: CandidateSummary;
  saved: boolean;
  onToggleSave: () => void;
  onView: () => void;
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

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={onView}
          className="rounded-lg bg-brand px-3.5 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          View profile
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

function CandidateDrawer({
  id,
  saved,
  onToggleSave,
  onClose,
}: {
  id: string;
  saved: boolean;
  onToggleSave: () => void;
  onClose: () => void;
}) {
  const [profile, setProfile] = useState<CandidateProfile | null>(null);

  useEffect(() => {
    setProfile(null);
    void getCandidate(id).then(setProfile).catch(() => {});
  }, [id]);

  const topScores = profile ? profile.scores.filter((s) => s.value > 0).sort((a, b) => b.value - a.value) : [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={onClose}>
      <div
        className="h-full w-full max-w-md overflow-y-auto border-l border-border bg-card p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">Verified profile</h2>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!profile ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <div className="mt-4 space-y-5">
            <div className="flex items-start gap-3">
              <Avatar name={profile.name} image={profile.profileImage} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-lg font-semibold">{profile.name}</p>
                  <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />
                </div>
                {profile.headline && <p className="text-sm text-muted-foreground">{profile.headline}</p>}
                {profile.location && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {profile.location}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold tabular-nums ${scoreColor(profile.overall)}`}>{profile.overall}</p>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">DNA</p>
              </div>
            </div>

            <button
              onClick={onToggleSave}
              className={`inline-flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                saved ? "border-primary/40 bg-primary/10" : "border-border hover:bg-accent"
              }`}
            >
              {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
              {saved ? "Shortlisted" : "Add to shortlist"}
            </button>

            {topScores.length > 0 && (
              <Section icon={Sparkles} title="Engineering DNA">
                <div className="space-y-2.5">
                  {topScores.slice(0, 8).map((s) => (
                    <div key={s.key}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span>{s.label}</span>
                        <span className="tabular-nums text-muted-foreground">{s.value}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${s.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {profile.verifiedSkills.length > 0 && (
              <Section icon={ShieldCheck} title={`Verified skills (${profile.verifiedSkills.length})`}>
                <div className="flex flex-wrap gap-1.5">
                  {profile.verifiedSkills.map((s) => (
                    <span key={s.technology} className="rounded-full border border-border bg-secondary/50 px-2.5 py-0.5 text-xs">
                      {s.technology}
                      {s.repositoryCount > 1 && <span className="text-muted-foreground"> ·{s.repositoryCount}</span>}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {profile.topRepos.length > 0 && (
              <Section icon={Github} title="Public repositories">
                <div className="space-y-2">
                  {profile.topRepos.map((r) => (
                    <a
                      key={r.name}
                      href={r.htmlUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-lg border border-border px-3 py-2 transition-colors hover:border-primary/40"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">{r.name}</span>
                        <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                          <Star className="h-3 w-3" /> {r.stars}
                        </span>
                      </div>
                      {r.description && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{r.description}</p>}
                      {r.language && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Building2 className="h-3 w-3" /> {r.language}
                        </p>
                      )}
                    </a>
                  ))}
                </div>
              </Section>
            )}

            <p className="text-xs text-muted-foreground">
              <ShieldCheck className="mr-1 inline h-3 w-3" />
              Verified evidence only — private repositories are never shown.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof Users; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
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
