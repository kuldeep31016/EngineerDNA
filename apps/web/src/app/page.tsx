import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Compass,
  Dna,
  FolderGit2,
  Gauge,
  GitBranch,
  Github,
  MessagesSquare,
  Search,
  ShieldCheck,
  Star,
} from "lucide-react";
import { LogoMark } from "@/components/Logo";

const NAV_LINKS = ["Product", "Features", "Students", "Recruiters", "Pricing"];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <Hero />
      <Problem />
      <HowItWorks />
      <Features />
      <Testimonials />
      <FinalCta />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-9">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark className="h-7 w-7" />
            <span className="text-[17px] font-bold tracking-tight">EngineerDNA</span>
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((l) => (
              <span
                key={l}
                className="cursor-pointer rounded-lg px-3 py-2 text-[13.5px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {l}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-[13.5px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Login
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-[10px] border border-border bg-secondary px-4 py-2 text-[13.5px] font-semibold transition-colors hover:border-white/20 hover:bg-accent"
          >
            <Github className="h-[15px] w-[15px]" /> Connect GitHub
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pb-24 pt-36">
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full opacity-20 blur-[120px]"
        style={{ background: "radial-gradient(closest-side, #6366f1, transparent)" }}
      />
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs">
            <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
              New
            </span>
            <span className="text-muted-foreground">Verified engineering profiles, automatically</span>
          </span>

          <h1 className="mt-6 text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl">
            The Trust Layer for <span className="text-brand-gradient">Technical Hiring.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            EngineerDNA analyzes real engineering evidence from GitHub and other developer platforms
            to verify skills, score projects, and build a profile recruiters can actually trust.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(99,102,241,0.4)] transition-opacity hover:opacity-90"
            >
              <Github className="h-4 w-4" /> Connect GitHub
            </Link>
            <a
              href="#how"
              className="flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-semibold transition-colors hover:bg-accent"
            >
              See how it works <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> No resume required
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Read-only access, revoke anytime
            </span>
          </div>
        </div>

        <ProfilePreview />
      </div>
    </section>
  );
}

function ProfilePreview() {
  const skills = ["TypeScript", "React", "Go", "Postgres", "+9"];
  const quality = [
    { label: "Architecture", value: 92 },
    { label: "Test Coverage", value: 78 },
    { label: "Documentation", value: 85 },
  ];
  return (
    <div className="rounded-2xl border border-border bg-card/80 shadow-2xl">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-red-500/80" />
        <span className="h-3 w-3 rounded-full bg-amber-400/80" />
        <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
        <span className="ml-3 font-mono text-xs text-muted-foreground">
          app.engineerdna.com/sarah-chen
        </span>
      </div>
      <div className="grid gap-4 p-5 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-background/50 p-4">
          <div className="flex items-start justify-between">
            <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Engineering score
            </span>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
              ▲ Top 4%
            </span>
          </div>
          <div className="mt-2 flex items-end gap-1">
            <span className="text-4xl font-black">847</span>
            <span className="mb-1 font-mono text-sm text-muted-foreground">/900</span>
          </div>
          <Radar />
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-background/50 p-4">
            <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Verified skills
            </span>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {skills.map((s) => (
                <span
                  key={s}
                  className="rounded-md border border-border bg-secondary px-2 py-1 font-mono text-[11px]"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-background/50 p-4">
            <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Project quality
            </span>
            <div className="mt-3 space-y-2.5">
              {quality.map((q) => (
                <div key={q.label}>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">{q.label}</span>
                    <span className="font-mono">{q.value}</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${q.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Radar() {
  // A simple hexagonal "engineering fingerprint".
  const points = "100,30 160,65 160,135 100,170 40,135 40,65";
  const inner = "100,60 138,80 138,120 100,140 62,120 62,80";
  return (
    <svg viewBox="0 0 200 200" className="mx-auto mt-3 h-40 w-40">
      <polygon points={points} fill="none" stroke="hsl(var(--border))" strokeWidth={1} />
      <polygon points={inner} fill="rgba(99,102,241,0.18)" stroke="#6366f1" strokeWidth={1.5} />
    </svg>
  );
}

function Problem() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-3xl text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Where EngineerDNA-verified talent is headed
        </p>
        <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Hiring is built on claims.
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          A resume lists technologies without a shred of proof. Recruiters burn hours validating
          keywords, and talented students have no way to show what they can actually build.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl items-stretch gap-4 md:grid-cols-[1fr_auto_1fr]">
        <Card className="p-6">
          <p className="text-sm font-semibold text-muted-foreground">Traditional Resume</p>
          <p className="mt-2 text-sm italic">“Proficient in React, Node, AWS”</p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {["No evidence behind any skill", "Keyword-matched, easily gamed", "Hours of manual screening"].map(
              (t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500/70" /> {t}
                </li>
              ),
            )}
          </ul>
        </Card>
        <div className="flex items-center justify-center">
          <span className="rounded-full border border-border bg-secondary px-3 py-1.5 font-mono text-xs text-muted-foreground">
            vs
          </span>
        </div>
        <Card className="border-primary/30 bg-primary/5 p-6">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <LogoMark className="h-5 w-5" /> EngineerDNA Verified Profile
          </p>
          <div className="mt-2 flex gap-2">
            {[
              ["React", 92],
              ["Node", 88],
              ["AWS", 81],
            ].map(([t, v]) => (
              <span key={t} className="rounded-md border border-border bg-secondary px-2 py-1 text-xs">
                <span className="font-mono">{t}</span>{" "}
                <span className="text-emerald-400">{v}</span>
              </span>
            ))}
          </div>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {[
              "Every skill backed by real commits",
              "Scored from analyzed code, not words",
              "Screened in seconds, with confidence",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-emerald-400" /> {t}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", icon: Github, title: "Connect GitHub", body: "Securely link your repositories in one click. Read-only, revoke anytime." },
    { n: "02", icon: Search, title: "Analyze Evidence", body: "Our engine reads commits, architecture, tests and dependencies across every repo." },
    { n: "03", icon: Dna, title: "Generate Developer DNA", body: "A verified profile of skills, scores and engineering strengths." },
    { n: "04", icon: BadgeCheck, title: "Get Verified & Grow", body: "Recruiters find you by proven ability. Students get a roadmap to grow." },
  ];
  return (
    <section id="how" className="px-6 py-20">
      <div className="mx-auto max-w-3xl text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">How it works</p>
        <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          From code to <span className="text-brand-gradient">verified DNA</span> in four steps.
        </h2>
      </div>
      <div className="mx-auto mt-12 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s) => (
          <Card key={s.n} className="p-6">
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <s.icon className="h-4 w-4" />
              </span>
              <span className="font-mono text-xs text-muted-foreground">{s.n}</span>
            </div>
            <h3 className="mt-4 font-semibold">{s.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

function Features() {
  const features = [
    { icon: FolderGit2, title: "Repository Intelligence", body: "Deep analysis of architecture, structure and code health across every repo." },
    { icon: Dna, title: "Developer DNA", body: "A multi-dimensional fingerprint of how you build, ship and collaborate." },
    { icon: BadgeCheck, title: "Verified Skills", body: "Every skill scored and backed by real evidence from your code." },
    { icon: GitBranch, title: "Engineering Timeline", body: "See your growth over time — when you first used each technology." },
    { icon: Compass, title: "Career Intelligence", body: "Personalized roadmaps and role matches based on your real strengths." },
    { icon: MessagesSquare, title: "AI Interview Prep", body: "Practice questions tailored to your code, your gaps and your target roles." },
    { icon: Gauge, title: "Project Quality Analysis", body: "Architecture, testing and documentation scored on every project." },
    { icon: Search, title: "Recruiter Dashboard", body: "Search verified talent by proven skill, not keywords." },
  ];
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-3xl text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Features</p>
        <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Everything you need to prove engineering ability.
        </h2>
        <p className="mt-4 text-muted-foreground">
          Systems working together to turn raw code into a profile recruiters can trust.
        </p>
      </div>
      <div className="mx-auto mt-12 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <Card key={f.title} className="p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <f.icon className="h-4 w-4" />
            </span>
            <h3 className="mt-4 text-sm font-semibold">{f.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  const quotes = [
    { quote: "I had no internships and a thin resume. EngineerDNA scored my side projects and my code finally spoke for itself.", name: "Aditya Kumar", role: "CS Student" },
    { quote: "As a self-taught engineer, credentials were always the barrier. My Engineering Score proved I actually shipped.", name: "Sara Thompson", role: "Software Engineer" },
    { quote: "Instead of guessing from resumes, my team opens a verified profile and sees exactly what a candidate has built.", name: "Daniel Mehta", role: "Technical Recruiter" },
  ];
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-3xl text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Trusted by engineers
        </p>
        <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Proof, not promises.</h2>
      </div>
      <div className="mx-auto mt-12 grid max-w-6xl gap-4 lg:grid-cols-3">
        {quotes.map((q) => (
          <Card key={q.name} className="p-6">
            <div className="flex gap-0.5 text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-current" />
              ))}
            </div>
            <p className="mt-4 text-sm leading-relaxed">“{q.quote}”</p>
            <div className="mt-5 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
                {q.name.charAt(0)}
              </span>
              <div>
                <p className="text-sm font-medium">{q.name}</p>
                <p className="text-xs text-muted-foreground">{q.role}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-10 text-center sm:p-14">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Stop listing skills. <span className="text-brand-gradient">Start proving them.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Connect your GitHub and watch your Engineering DNA build itself in under a minute.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(99,102,241,0.4)] transition-opacity hover:opacity-90"
        >
          <Github className="h-4 w-4" /> Create Your Engineering DNA
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border px-6 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-2.5">
          <LogoMark className="h-6 w-6" />
          <span className="text-sm text-muted-foreground">
            The trust layer between developers and recruiters. Evidence over claims.
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          © 2026 EngineerDNA, Inc. Built for engineers, by engineers.
        </span>
      </div>
    </footer>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-border bg-card ${className}`}>{children}</div>;
}
