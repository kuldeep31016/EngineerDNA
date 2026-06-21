"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpDown,
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
  SlidersHorizontal,
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

type SortKey = "match" | "dna" | "verified" | "experience" | "repos";
const SORTS: { value: SortKey; label: string }[] = [
  { value: "match", label: "Best match" },
  { value: "dna", label: "DNA score" },
  { value: "verified", label: "Most verified skills" },
  { value: "experience", label: "Most experience" },
  { value: "repos", label: "Most public repos" },
];

interface Filters {
  minDna: number;
  minVerified: number;
  minExp: number;
  location: string;
  matchAll: boolean;
}
const NO_FILTERS: Filters = { minDna: 0, minVerified: 0, minExp: 0, location: "", matchAll: false };

/** Deterministic client-side filter + sort over the search results. */
function refine(
  list: CandidateSummary[],
  filters: Filters,
  sort: SortKey,
  searchedSkillCount: number,
): CandidateSummary[] {
  const loc = filters.location.trim().toLowerCase();
  const out = list.filter(
    (c) =>
      c.overall >= filters.minDna &&
      c.verifiedSkillCount >= filters.minVerified &&
      (filters.minExp === 0 || (c.experienceYears ?? 0) >= filters.minExp) &&
      (!loc || (c.location ?? "").toLowerCase().includes(loc)) &&
      (!filters.matchAll || searchedSkillCount === 0 || c.matchedSkills.length >= searchedSkillCount),
  );
  const by: Record<SortKey, (a: CandidateSummary, b: CandidateSummary) => number> = {
    match: (a, b) => b.matchedSkills.length - a.matchedSkills.length || b.overall - a.overall,
    dna: (a, b) => b.overall - a.overall,
    verified: (a, b) => b.verifiedSkillCount - a.verifiedSkillCount,
    experience: (a, b) => (b.experienceYears ?? -1) - (a.experienceYears ?? -1),
    repos: (a, b) => b.publicRepoCount - a.publicRepoCount,
  };
  return [...out].sort(by[sort]);
}

function activeFilterCount(f: Filters): number {
  return [f.minDna > 0, f.minVerified > 0, f.minExp > 0, f.location.trim() !== "", f.matchAll].filter(Boolean).length;
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
  const [sortBy, setSortBy] = useState<SortKey>("match");
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
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
  const refined = useMemo(
    () => (list ? refine(list, filters, sortBy, skills.length) : []),
    [list, filters, sortBy, skills.length],
  );
  const paged = usePagination(refined, 10);
  const activeCount = activeFilterCount(filters);

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
          <SearchToolbar
            total={list.length}
            shown={refined.length}
            sortBy={sortBy}
            onSort={setSortBy}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters((v) => !v)}
            activeCount={activeCount}
          />
          {showFilters && (
            <FilterPanel filters={filters} onChange={setFilters} onClear={() => setFilters(NO_FILTERS)} />
          )}

          {refined.length === 0 ? (
            <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
              <SlidersHorizontal className="mx-auto h-7 w-7 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">No candidates match these filters.</p>
              <button
                onClick={() => setFilters(NO_FILTERS)}
                className="mt-3 text-sm font-medium text-primary hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
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
            </>
          )}
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

function SearchToolbar({
  total,
  shown,
  sortBy,
  onSort,
  showFilters,
  onToggleFilters,
  activeCount,
}: {
  total: number;
  shown: number;
  sortBy: SortKey;
  onSort: (s: SortKey) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  activeCount: number;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-xs text-muted-foreground">
        {shown === total ? `${total} candidate${total === 1 ? "" : "s"}` : `${shown} of ${total} shown`}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleFilters}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
            showFilters || activeCount > 0
              ? "border-primary/40 bg-primary/10 text-foreground"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
          {activeCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
              {activeCount}
            </span>
          )}
        </button>
        <div className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs">
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={sortBy}
            onChange={(e) => onSort(e.target.value as SortKey)}
            className="cursor-pointer bg-transparent font-medium text-foreground outline-none"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value} className="bg-card text-foreground">
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function FilterPanel({
  filters,
  onChange,
  onClear,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  onClear: () => void;
}) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <ChipRow label="Min DNA score" value={filters.minDna} options={[0, 50, 70, 85]} onPick={(v) => set({ minDna: v })} fmt={(v) => (v === 0 ? "Any" : `${v}+`)} />
      <ChipRow label="Min verified skills" value={filters.minVerified} options={[0, 3, 5, 10]} onPick={(v) => set({ minVerified: v })} fmt={(v) => (v === 0 ? "Any" : `${v}+`)} />
      <ChipRow label="Min experience" value={filters.minExp} options={[0, 1, 3, 5]} onPick={(v) => set({ minExp: v })} fmt={(v) => (v === 0 ? "Any" : `${v}+ yr`)} />
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs">
          <span className="font-medium text-muted-foreground">Location</span>
          <input
            value={filters.location}
            onChange={(e) => set({ location: e.target.value })}
            placeholder="e.g. Bengaluru, Remote…"
            className="w-44 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary/60"
          />
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-muted-foreground">
          <input
            type="checkbox"
            checked={filters.matchAll}
            onChange={(e) => set({ matchAll: e.target.checked })}
            className="h-4 w-4 cursor-pointer accent-[#6366f1]"
          />
          Matches all searched skills
        </label>
        {activeFilterCount(filters) > 0 && (
          <button onClick={onClear} className="ml-auto text-xs font-medium text-primary hover:underline">
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}

function ChipRow({
  label,
  value,
  options,
  onPick,
  fmt,
}: {
  label: string;
  value: number;
  options: number[];
  onPick: (v: number) => void;
  fmt: (v: number) => string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-32 shrink-0 text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onPick(o)}
            className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
              value === o
                ? "border-primary/40 bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {fmt(o)}
          </button>
        ))}
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
