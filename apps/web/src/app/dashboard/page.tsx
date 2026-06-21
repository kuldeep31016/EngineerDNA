"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Share2, Search } from "lucide-react";
import type {
  DeveloperDna,
  GithubStatus,
  Profile,
  Repository,
  Score,
  StudentApplicationStats,
  VerificationResult,
  VerifiedSkill,
} from "@engineerdna/shared";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LoadingScreen } from "@/components/LoadingScreen";
import { getProfile } from "@/services/profile";
import { getDna } from "@/services/dna";
import { getGithubStatus, listRepositories } from "@/services/github";
import { getVerification } from "@/services/verification";
import { getMyApplicationStats } from "@/services/applications";

const C = {
  panel: "#141417",
  line: "rgba(255,255,255,.08)",
  line2: "rgba(255,255,255,.05)",
  tx: "#FAFAFA",
  tx2: "#A1A1AA",
  tx3: "#8E8E99",
  ind: "#A5B4FC",
  grn: "#6EE7B7",
};
const mono = "'JetBrains Mono', ui-monospace, monospace";

interface DashData {
  profile: Profile | null;
  dna: DeveloperDna | null;
  status: GithubStatus | null;
  verification: VerificationResult | null;
  repos: Repository[];
  appStats: StudentApplicationStats | null;
}

function DashboardContent() {
  const [data, setData] = useState<DashData | null>(null);

  useEffect(() => {
    void Promise.all([
      getProfile().catch(() => null),
      getDna().catch(() => null),
      getGithubStatus().catch(() => null),
      getVerification().catch(() => null),
      listRepositories().catch(() => [] as Repository[]),
      getMyApplicationStats().catch(() => null),
    ]).then(([profile, dna, status, verification, repos, appStats]) => {
      setData({ profile, dna, status, verification, repos, appStats });
    });
  }, []);

  if (!data) return <LoadingScreen label="Building your Developer DNA…" />;

  const { profile, dna, status, verification, repos, appStats } = data;
  const user = profile?.user;
  const overall = dna?.overall ?? 0;
  const verifiedCount = verification?.verifiedCount ?? 0;
  const repoCount = status?.repositoryCount ?? repos.length;
  const handle = status?.githubLogin ?? profile?.githubUsername ?? null;
  const topRepos = [...repos].sort((a, b) => b.stars - a.stars).slice(0, 3);

  return (
    <div className="min-h-screen">
      {/* Topbar */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-7 py-4 md:pr-20" style={{ borderColor: C.line2 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-.02em" }}>Developer DNA</div>
          <div style={{ fontSize: 12.5, color: C.tx3 }}>
            {repoCount} {repoCount === 1 ? "repository" : "repositories"} ·{" "}
            {verifiedCount} verified skill{verifiedCount === 1 ? "" : "s"}
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="hidden items-center gap-2 sm:flex" style={{ padding: "8px 12px", border: `1px solid ${C.line}`, borderRadius: 10, width: 200 }}>
            <Search className="h-3.5 w-3.5" style={{ color: C.tx3 }} />
            <span style={{ fontSize: 12.5, color: C.tx3 }}>Search</span>
          </div>
          <Link href="/profile" className="flex items-center gap-2 transition-opacity hover:opacity-90" style={{ fontSize: 13, fontWeight: 600, color: "#09090B", background: "#fff", padding: "9px 15px", borderRadius: 10 }}>
            <Share2 className="h-3.5 w-3.5" /> Share Profile
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1100px] px-7 py-6">
        {/* Profile header */}
        <div className="mb-[18px] grid gap-5 sm:grid-cols-[1fr_auto]" style={{ border: `1px solid ${C.line}`, borderRadius: 18, background: "radial-gradient(110% 130% at 100% 0%,rgba(99,102,241,.12),transparent 50%),linear-gradient(180deg,#101014,#0B0B0E)", padding: 26 }}>
          <div className="flex gap-[18px]">
            <div className="relative shrink-0" style={{ width: 72, height: 72 }}>
              {user?.profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.profileImage} alt="" style={{ width: 72, height: 72, borderRadius: 18, objectFit: "cover" }} />
              ) : (
                <div className="flex items-center justify-center" style={{ width: 72, height: 72, borderRadius: 18, background: "linear-gradient(140deg,#6366F1,#8B5CF6)", fontSize: 26, fontWeight: 800 }}>
                  {(user?.name ?? user?.email ?? "Y").charAt(0).toUpperCase()}
                </div>
              )}
              {verifiedCount > 0 && (
                <div className="absolute flex items-center justify-center" style={{ bottom: -4, right: -4, width: 24, height: 24, borderRadius: 999, background: "#0B0B0E" }}>
                  <div className="flex items-center justify-center" style={{ width: 18, height: 18, borderRadius: 999, background: "#34D399" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="#06281C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                </div>
              )}
            </div>
            <div>
              <div className="mb-1.5 flex items-center gap-2.5">
                <h2 style={{ fontSize: 23, fontWeight: 800, letterSpacing: "-.02em", margin: 0 }}>{user?.name ?? "Your profile"}</h2>
                {verifiedCount > 0 && (
                  <span className="flex items-center gap-1.5" style={{ fontSize: 11, fontWeight: 600, color: C.grn, background: "rgba(52,211,153,.12)", border: "1px solid rgba(52,211,153,.22)", padding: "3px 9px", borderRadius: 999 }}>VERIFIED</span>
                )}
              </div>
              <p style={{ fontSize: 14, color: C.tx2, margin: "0 0 12px" }}>{profile?.headline ?? "Add a headline on your passport"}</p>
              <div className="flex flex-wrap items-center gap-4" style={{ fontSize: 12.5, color: C.tx3 }}>
                {handle && (
                  <span className="flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#8E8E99"><path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49v-1.7c-2.78.62-3.37-1.22-3.37-1.22-.46-1.18-1.11-1.49-1.11-1.49-.91-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.57 2.34 1.12 2.91.85.09-.66.35-1.12.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05a9.3 9.3 0 0 1 5 0c1.91-1.32 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.35 4.8-4.58 5.05.36.32.68.94.68 1.9v2.82c0 .27.18.6.69.49A10.02 10.02 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" /></svg>
                    @{handle}
                  </span>
                )}
                {profile?.location && <span>{profile.location}</span>}
                {profile?.openToWork && <span style={{ color: C.grn }}>Open to work</span>}
              </div>
            </div>
          </div>
          {/* score ring */}
          <div className="flex flex-col items-center justify-center border-t pt-5 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0" style={{ borderColor: C.line2 }}>
            <ScoreRing value={overall} />
            {dna && dna.topStrengths[0] && (
              <span style={{ fontSize: 11, color: C.grn, background: "rgba(52,211,153,.12)", padding: "3px 10px", borderRadius: 999, marginTop: 10 }}>{dna.topStrengths[0]}</span>
            )}
          </div>
        </div>

        {/* KPIs */}
        <div className="mb-[18px] grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          <Kpi label="ENGINEERING SCORE" value={`${overall}`} sub={dna ? levelOf(overall) : "no evidence yet"} />
          <Kpi label="TOP STRENGTH" value={dna?.topStrengths[0] ?? "—"} sub="your strongest area" small />
          <Kpi label="REPOSITORIES" value={`${repoCount}`} sub={status?.connected ? "imported from GitHub" : "connect GitHub"} />
          <Kpi label="VERIFIED SKILLS" value={`${verifiedCount}`} sub="backed by evidence" />
        </div>

        {/* Hiring readiness + application funnel */}
        <div className="mb-[18px] grid gap-3.5 lg:grid-cols-[1.15fr_1fr]">
          <ReadinessPanel
            readiness={computeReadiness({ profile, overall, verifiedCount, repoCount, status, appStats })}
          />
          <FunnelPanel stats={appStats} />
        </div>

        {/* Radar + skills */}
        <div className="mb-[18px] grid gap-3.5 lg:grid-cols-[1fr_1.15fr]">
          <Panel>
            <div className="mb-1.5 flex items-center justify-between">
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>Engineering DNA</span>
              <Link href="/dna" style={{ fontFamily: mono, fontSize: 10.5, color: C.ind }}>details →</Link>
            </div>
            <Radar scores={dna?.scores ?? []} />
          </Panel>
          <Panel>
            <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 18 }}>Verified Skills</div>
            <SkillBars verification={verification} />
          </Panel>
        </div>

        {/* Top repositories */}
        <div className="mb-3 flex items-center justify-between">
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-.01em" }}>Top Repositories</span>
          <Link href="/repositories" style={{ fontSize: 12.5, color: C.ind }}>View all →</Link>
        </div>
        {topRepos.length === 0 ? (
          <Panel>
            <p style={{ fontSize: 13, color: C.tx2 }}>
              No repositories yet.{" "}
              <Link href="/repositories" style={{ color: C.ind }}>Connect GitHub and sync</Link> to populate your DNA.
            </p>
          </Panel>
        ) : (
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {topRepos.map((r) => (
              <Link key={r.id} href={`/repositories/${r.id}`} className="transition-colors hover:border-[rgba(99,102,241,.3)]" style={{ border: `1px solid ${C.line}`, borderRadius: 14, background: C.panel, padding: 18 }}>
                <div className="mb-2 flex items-center gap-2">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="3" stroke="#A5B4FC" strokeWidth="1.6" /></svg>
                  <span style={{ fontSize: 14, fontWeight: 600 }} className="truncate">{r.name}</span>
                </div>
                <p className="line-clamp-2" style={{ fontSize: 12.5, color: C.tx2, lineHeight: 1.5, margin: "0 0 14px", minHeight: 36 }}>
                  {r.description ?? "No description."}
                </p>
                <div className="flex items-center gap-3.5" style={{ fontSize: 11.5, color: C.tx3 }}>
                  {r.language && (
                    <span className="flex items-center gap-1.5">
                      <span style={{ width: 9, height: 9, borderRadius: 999, background: "#6EE7B7", display: "inline-block" }} /> {r.language}
                    </span>
                  )}
                  <span>★ {r.stars}</span>
                  <span>⑂ {r.forks}</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Insights */}
        {dna && overall > 0 && (
          <div className="mt-[18px]">
            <Panel>
              <div className="mb-4 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3a6 6 0 0 0-4 10.5c.6.6 1 1.3 1 2.1V17h6v-1.4c0-.8.4-1.5 1-2.1A6 6 0 0 0 12 3Z" stroke="#C4B5FD" strokeWidth="1.6" /><path d="M9 20h6" stroke="#C4B5FD" strokeWidth="1.6" strokeLinecap="round" /></svg>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Insights</span>
              </div>
              <div className="flex flex-col gap-3">
                {insightsFrom(dna, verifiedCount).map((ins, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span style={{ width: 7, height: 7, borderRadius: 999, background: ["#6EE7B7", "#A5B4FC", "#FBBF77"][i % 3], marginTop: 6, flexShrink: 0 }} />
                    <p style={{ fontSize: 13.5, color: C.tx, lineHeight: 1.5, margin: 0 }}>{ins}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        )}
      </div>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div style={{ border: `1px solid ${C.line}`, borderRadius: 16, background: C.panel, padding: 20 }}>{children}</div>;
}

interface ReadinessItem {
  label: string;
  done: boolean;
  weight: number;
  href: string;
  cta: string;
}
interface Readiness {
  score: number;
  items: ReadinessItem[];
}

/** Deterministic hiring-readiness score — a weighted checklist of the steps that
 *  make a candidate credible to recruiters. No LLM, no guessing. */
function computeReadiness(d: {
  profile: Profile | null;
  overall: number;
  verifiedCount: number;
  repoCount: number;
  status: GithubStatus | null;
  appStats: StudentApplicationStats | null;
}): Readiness {
  const { profile, overall, verifiedCount, repoCount, status, appStats } = d;
  const items: ReadinessItem[] = [
    { label: "Connect your GitHub", done: !!status?.connected, weight: 15, href: "/repositories", cta: "Connect" },
    { label: "Sync at least 3 repositories", done: repoCount >= 3, weight: 10, href: "/repositories", cta: "Sync repos" },
    { label: "Add a headline", done: !!profile?.headline, weight: 8, href: "/profile", cta: "Add headline" },
    { label: "Set your location", done: !!profile?.location, weight: 5, href: "/profile", cta: "Add location" },
    { label: "Verify your first skill", done: verifiedCount >= 1, weight: 15, href: "/evidence", cta: "Verify skills" },
    { label: "Reach an engineering score of 40+", done: overall >= 40, weight: 12, href: "/dna", cta: "See your DNA" },
    {
      label: "Go public — claim a username & turn on your profile",
      done: !!profile?.username && !!profile?.isPublic,
      weight: 15,
      href: "/profile",
      cta: "Go public",
    },
    { label: "Apply to your first job", done: (appStats?.total ?? 0) >= 1, weight: 10, href: "/jobs", cta: "Browse jobs" },
    {
      label: "Get on a recruiter's radar (shortlist or interview)",
      done: (appStats?.shortlisted ?? 0) + (appStats?.interviews ?? 0) + (appStats?.offers ?? 0) >= 1,
      weight: 10,
      href: "/applications",
      cta: "Track applications",
    },
  ];
  const score = items.filter((i) => i.done).reduce((sum, i) => sum + i.weight, 0);
  return { score, items };
}

function readinessTone(score: number): { label: string; color: string } {
  if (score >= 85) return { label: "Recruiter-ready", color: C.grn };
  if (score >= 55) return { label: "Getting there", color: "#A5B4FC" };
  if (score >= 25) return { label: "Early days", color: "#FBBF77" };
  return { label: "Just starting", color: C.tx3 };
}

function ReadinessPanel({ readiness }: { readiness: Readiness }) {
  const tone = readinessTone(readiness.score);
  const next = readiness.items.filter((i) => !i.done).sort((a, b) => b.weight - a.weight).slice(0, 3);

  return (
    <Panel>
      <div className="mb-3 flex items-center justify-between">
        <span style={{ fontSize: 13.5, fontWeight: 600 }}>Hiring readiness</span>
        <span style={{ fontFamily: mono, fontSize: 11, color: tone.color, background: "rgba(255,255,255,.04)", padding: "3px 9px", borderRadius: 999 }}>
          {tone.label}
        </span>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <span style={{ fontFamily: mono, fontSize: 26, fontWeight: 700, color: tone.color }}>{readiness.score}</span>
        <span style={{ fontSize: 11, color: C.tx3 }}>/100</span>
        <div className="flex-1" style={{ height: 7, borderRadius: 4, background: "rgba(255,255,255,.06)" }}>
          <div style={{ width: `${readiness.score}%`, height: "100%", borderRadius: 4, background: "linear-gradient(90deg,#6366F1,#8B5CF6)" }} />
        </div>
      </div>

      {/* Next best actions */}
      {next.length > 0 ? (
        <div className="mt-4">
          <span style={{ fontSize: 11, color: C.tx3 }}>NEXT BEST ACTIONS</span>
          <div className="mt-2 flex flex-col gap-2">
            {next.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center justify-between gap-3 transition-colors hover:border-[rgba(99,102,241,.3)]"
                style={{ border: `1px solid ${C.line}`, borderRadius: 10, padding: "9px 12px" }}
              >
                <span className="flex items-center gap-2.5" style={{ fontSize: 13, color: C.tx }}>
                  <span style={{ width: 16, height: 16, borderRadius: 999, border: `1.5px solid ${C.tx3}`, display: "inline-block", flexShrink: 0 }} />
                  {item.label}
                </span>
                <span className="shrink-0" style={{ fontSize: 11.5, fontWeight: 600, color: C.ind }}>{item.cta} →</span>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-4" style={{ fontSize: 13, color: C.grn }}>
          You&apos;ve completed every readiness step — recruiters see a fully verified profile.
        </p>
      )}
    </Panel>
  );
}

function FunnelPanel({ stats }: { stats: StudentApplicationStats | null }) {
  const total = stats?.total ?? 0;
  const stages = [
    { label: "Applied", value: total, color: "#A5B4FC" },
    { label: "Shortlisted", value: stats?.shortlisted ?? 0, color: "#C4B5FD" },
    { label: "Interviews", value: stats?.interviews ?? 0, color: "#7DD3FC" },
    { label: "Offers", value: stats?.offers ?? 0, color: "#6EE7B7" },
  ];
  const max = Math.max(total, 1);

  return (
    <Panel>
      <div className="mb-3 flex items-center justify-between">
        <span style={{ fontSize: 13.5, fontWeight: 600 }}>Application funnel</span>
        <Link href="/applications" style={{ fontFamily: mono, fontSize: 10.5, color: C.ind }}>track →</Link>
      </div>

      {total === 0 ? (
        <div className="flex flex-col gap-2 py-2">
          <p style={{ fontSize: 13, color: C.tx2 }}>
            No applications yet. Your verified profile does the talking — start applying.
          </p>
          <Link href="/jobs" className="self-start" style={{ fontSize: 12.5, fontWeight: 600, color: C.ind }}>
            Browse the job board →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {stages.map((s) => (
            <div key={s.label}>
              <div className="mb-1 flex items-center justify-between" style={{ fontSize: 12.5 }}>
                <span style={{ color: C.tx2 }}>{s.label}</span>
                <span style={{ fontFamily: mono, color: "#fff" }}>{s.value}</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,.06)" }}>
                <div style={{ width: `${Math.max(s.value > 0 ? 6 : 0, (s.value / max) * 100)}%`, height: "100%", borderRadius: 4, background: s.color }} />
              </div>
            </div>
          ))}
          {(stats?.rejected ?? 0) > 0 && (
            <p style={{ fontSize: 11.5, color: C.tx3, marginTop: 2 }}>{stats?.rejected} closed / not selected</p>
          )}
        </div>
      )}
    </Panel>
  );
}

function Kpi({ label, value, sub, small }: { label: string; value: string; sub: string; small?: boolean }) {
  return (
    <div style={{ border: `1px solid ${C.line}`, borderRadius: 14, background: C.panel, padding: 16 }}>
      <span style={{ fontSize: 11, color: C.tx3 }}>{label}</span>
      <div className="mt-2.5 truncate" style={{ fontFamily: small ? undefined : mono, fontSize: small ? 18 : 26, fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: 11.5, color: C.tx3, marginTop: 3 }}>{sub}</div>
    </div>
  );
}

function ScoreRing({ value }: { value: number }) {
  const r = 46;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.max(0, Math.min(100, value)) / 100);
  return (
    <div className="relative" style={{ width: 108, height: 108 }}>
      <svg width="108" height="108" viewBox="0 0 108 108" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="54" cy="54" r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="9" />
        <circle cx="54" cy="54" r={r} fill="none" stroke="url(#scoreG)" strokeWidth="9" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} />
        <defs><linearGradient id="scoreG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#6366F1" /><stop offset="1" stopColor="#8B5CF6" /></linearGradient></defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span style={{ fontFamily: mono, fontSize: 30, fontWeight: 700, lineHeight: 1 }}>{value}</span>
        <span style={{ fontFamily: mono, fontSize: 10, color: C.tx3 }}>/100</span>
      </div>
    </div>
  );
}

const RADAR_KEYS = ["systemdesign", "backend", "frontend", "database", "devops", "testing"];
const RADAR_LABELS: Record<string, string> = {
  systemdesign: "SYS DESIGN",
  backend: "BACKEND",
  frontend: "FRONTEND",
  database: "DATABASE",
  devops: "DEVOPS",
  testing: "TESTING",
};

function Radar({ scores }: { scores: Score[] }) {
  const cx = 150, cy = 140, R = 110;
  const byKey = new Map(scores.map((s) => [s.key, s.value]));
  const dims = RADAR_KEYS.map((k) => ({ label: RADAR_LABELS[k]!, value: byKey.get(k) ?? 0 }));
  const angle = (i: number) => ((-90 + i * 60) * Math.PI) / 180;
  const pt = (i: number, rad: number) => `${cx + rad * Math.cos(angle(i))},${cy + rad * Math.sin(angle(i))}`;
  const ring = (frac: number) => dims.map((_, i) => pt(i, R * frac)).join(" ");
  const valuePoly = dims.map((d, i) => pt(i, (R * Math.max(4, d.value)) / 100)).join(" ");

  return (
    <svg width="100%" viewBox="0 0 300 280" style={{ display: "block" }}>
      {[1, 0.66, 0.33].map((f) => (
        <polygon key={f} points={ring(f)} fill="none" stroke={`rgba(255,255,255,${f === 1 ? 0.07 : 0.04})`} strokeWidth="1" />
      ))}
      {dims.map((_, i) => (
        <line key={i} x1={cx} y1={cy} x2={pt(i, R).split(",")[0]} y2={pt(i, R).split(",")[1]} stroke="rgba(255,255,255,.05)" strokeWidth="1" />
      ))}
      <polygon points={valuePoly} fill="rgba(99,102,241,.2)" stroke="#8B5CF6" strokeWidth="1.8" />
      <g fill="#fff">
        {dims.map((d, i) => {
          const [x, y] = pt(i, (R * Math.max(4, d.value)) / 100).split(",");
          return <circle key={i} cx={x} cy={y} r="3" />;
        })}
      </g>
      <g fontFamily={mono} fontSize="9.5" fill="#9A9AA4" textAnchor="middle">
        {dims.map((d, i) => {
          const [x, y] = pt(i, R + 20).split(",").map(Number);
          return <text key={i} x={x} y={(y ?? 0) + 3}>{d.label}</text>;
        })}
      </g>
    </svg>
  );
}

function skillLevel(value: number): { label: string; color: string; bg: string; bar: string } {
  if (value >= 90) return { label: "EXPERT", color: "#6EE7B7", bg: "rgba(52,211,153,.12)", bar: "linear-gradient(90deg,#34D399,#10B981)" };
  if (value >= 80) return { label: "ADVANCED", color: "#A5B4FC", bg: "rgba(99,102,241,.12)", bar: "linear-gradient(90deg,#6366F1,#8B5CF6)" };
  if (value >= 60) return { label: "PROFICIENT", color: "#FBBF77", bg: "rgba(251,146,60,.12)", bar: "linear-gradient(90deg,#FB923C,#F97316)" };
  return { label: "CLAIMED", color: C.tx3, bg: "rgba(255,255,255,.05)", bar: "rgba(255,255,255,.2)" };
}

function SkillBars({ verification }: { verification: VerificationResult | null }) {
  if (!verification || verification.skills.length === 0) {
    return (
      <p style={{ fontSize: 13, color: C.tx2 }}>
        No skills yet. Add them on your <Link href="/profile" style={{ color: C.ind }}>passport</Link> and verify against evidence.
      </p>
    );
  }
  const ranked = [...verification.skills]
    .map((s) => ({ s, value: s.status === "VERIFIED" ? Math.round(s.confidence * 100) : 30 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
  return (
    <div className="flex flex-col gap-[15px]">
      {ranked.map(({ s, value }: { s: VerifiedSkill; value: number }) => {
        const lv = skillLevel(value);
        return (
          <div key={s.id}>
            <div className="mb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 13, color: C.tx }}>{s.name}</span>
                <span style={{ fontFamily: mono, fontSize: 9.5, color: lv.color, background: lv.bg, padding: "1px 6px", borderRadius: 5 }}>{lv.label}</span>
              </div>
              <span style={{ fontFamily: mono, fontSize: 12, color: "#fff" }}>{value}</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,.06)" }}>
              <div style={{ width: `${value}%`, height: "100%", background: lv.bar, borderRadius: 3 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function levelOf(v: number): string {
  if (v <= 0) return "no evidence yet";
  if (v < 35) return "emerging";
  if (v < 65) return "proficient";
  if (v < 85) return "strong";
  return "expert";
}

function insightsFrom(dna: DeveloperDna, verifiedCount: number): string[] {
  const out: string[] = [];
  if (dna.topStrengths[0]) out.push(`Your strongest area is ${dna.topStrengths[0]} — keep building on it.`);
  const weakest = [...dna.scores].filter((s) => s.value > 0).sort((a, b) => a.value - b.value)[0];
  if (weakest) out.push(`Improve ${weakest.label} by analyzing more repositories that use it.`);
  out.push(`${verifiedCount} of your skills are verified by real evidence — add more to climb your score.`);
  return out;
}

export default function DashboardPage() {
  return (
    <ProtectedRoute roles={["STUDENT", "ADMIN"]}>
      <DashboardContent />
    </ProtectedRoute>
  );
}
