import Link from "next/link";

/* Exact design tokens from the provided EngineerDNA design. */
const C = {
  bg: "#09090B",
  panel: "#141417",
  line: "rgba(255,255,255,.08)",
  line2: "rgba(255,255,255,.05)",
  tx: "#FAFAFA",
  tx2: "#A1A1AA",
  tx3: "#6E6E78",
  ind: "#6366F1",
  vio: "#8B5CF6",
  indText: "#A5B4FC",
  grnText: "#6EE7B7",
  vioText: "#C4B5FD",
};

const GitHubIcon = ({ size = 17, fill = "#fff" }: { size?: number; fill?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} aria-hidden>
    <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49v-1.7c-2.78.62-3.37-1.22-3.37-1.22-.46-1.18-1.11-1.49-1.11-1.49-.91-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.57 2.34 1.12 2.91.85.09-.66.35-1.12.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05a9.3 9.3 0 0 1 5 0c1.91-1.32 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.35 4.8-4.58 5.05.36.32.68.94.68 1.9v2.82c0 .27.18.6.69.49A10.02 10.02 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
  </svg>
);

const DnaIcon = ({ size = 16, stroke = "#fff", w = 2 }: { size?: number; stroke?: string; w?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M7 4c0 6 10 10 10 16M17 4c0 6-10 10-10 16" stroke={stroke} strokeWidth={w} strokeLinecap="round" />
  </svg>
);

const Brand = ({ size = 28 }: { size?: number }) => (
  <div
    className="flex items-center justify-center"
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.29,
      background: "linear-gradient(140deg,#6366F1,#8B5CF6)",
      boxShadow: "0 0 20px rgba(99,102,241,.45)",
    }}
  >
    <DnaIcon size={size * 0.57} />
  </div>
);

const mono = "'JetBrains Mono', ui-monospace, monospace";

export default function LandingPage() {
  return (
    <div style={{ background: C.bg, color: C.tx, minHeight: "100vh" }}>
      <Nav />
      <Hero />
      <TrustedBy />
      <Problem />
      <HowItWorks />
      <Features />
      <Showcase />
      <WhyComparison />
      <Testimonials />
      <FinalCta />
      <Footer />
    </div>
  );
}

/* ---------------- NAV ---------------- */
function Nav() {
  const links: { label: string; href: string }[] = [
    { label: "Product", href: "#how" },
    { label: "Features", href: "#features" },
    { label: "Students", href: "/dashboard" },
    { label: "Recruiters", href: "#showcase" },
    { label: "Pricing", href: "#" },
    { label: "Resources", href: "#" },
  ];
  return (
    <nav
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-between"
      style={{
        padding: "16px 40px",
        background: "rgba(9,9,11,.72)",
        backdropFilter: "blur(18px)",
        borderBottom: `1px solid ${C.line2}`,
      }}
    >
      <div className="flex items-center gap-10">
        <Link href="/" className="flex items-center gap-2.5">
          <Brand />
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-.02em" }}>EngineerDNA</span>
        </Link>
        <div className="hidden items-center gap-1 lg:flex">
          {links.map((l) =>
            l.href.startsWith("#") ? (
              <a
                key={l.label}
                href={l.href}
                className="cursor-pointer rounded-lg px-3 py-2 transition-colors hover:bg-white/5"
                style={{ fontSize: 13.5, color: C.tx2 }}
              >
                {l.label}
              </a>
            ) : (
              <Link
                key={l.label}
                href={l.href}
                className="cursor-pointer rounded-lg px-3 py-2 transition-colors hover:bg-white/5"
                style={{ fontSize: 13.5, color: C.tx2 }}
              >
                {l.label}
              </Link>
            ),
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/login" style={{ fontSize: 13.5, color: C.tx2 }} className="hover:text-white">
          Login
        </Link>
        <Link
          href="/connect"
          className="flex items-center gap-2 transition-colors hover:bg-[#202024]"
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: "#fff",
            background: "#18181B",
            border: `1px solid ${C.line}`,
            padding: "9px 16px",
            borderRadius: 10,
          }}
        >
          <GitHubIcon size={15} /> Connect GitHub
        </Link>
      </div>
    </nav>
  );
}

/* ---------------- HERO ---------------- */
function Hero() {
  return (
    <section className="relative mx-auto max-w-[1280px] overflow-hidden" style={{ padding: "150px 40px 90px" }}>
      <div
        className="pointer-events-none absolute"
        style={{ top: -100, right: -60, width: 620, height: 620, background: "radial-gradient(circle,rgba(99,102,241,.16),transparent 65%)", filter: "blur(20px)" }}
      />
      <div className="relative grid items-center gap-14 lg:grid-cols-[1fr_1.02fr]">
        <div>
          <div
            className="mb-7 inline-flex items-center gap-2"
            style={{ padding: "6px 12px 6px 8px", border: `1px solid ${C.line}`, borderRadius: 999, background: "rgba(255,255,255,.02)" }}
          >
            <span style={{ fontFamily: mono, fontSize: 10.5, fontWeight: 600, letterSpacing: ".06em", color: "#fff", background: "linear-gradient(140deg,#6366F1,#8B5CF6)", padding: "3px 7px", borderRadius: 999 }}>
              NEW
            </span>
            <span style={{ fontSize: 12.5, color: C.tx2 }}>Verified engineering profiles, automatically</span>
          </div>
          <h1 style={{ fontSize: 60, lineHeight: 1.03, fontWeight: 900, letterSpacing: "-.035em", margin: "0 0 22px", textWrap: "balance" } as React.CSSProperties}>
            The Trust Layer for
            <br />
            Technical Hiring.
          </h1>
          <p style={{ fontSize: 17.5, lineHeight: 1.55, color: C.tx2, maxWidth: 520, margin: "0 0 34px" }}>
            EngineerDNA analyzes real engineering evidence from GitHub and other developer platforms to verify skills,
            evaluate projects, and help recruiters hire on proven ability — not resume claims.
          </p>
          <div className="mb-9 flex items-center gap-3">
            <Link
              href="/connect"
              className="flex items-center gap-2.5"
              style={{ fontSize: 15, fontWeight: 600, color: "#fff", background: "linear-gradient(140deg,#6366F1,#7C5CF6)", padding: "13px 22px", borderRadius: 12, boxShadow: "0 8px 28px rgba(99,102,241,.35)" }}
            >
              <GitHubIcon /> Connect GitHub
            </Link>
            <a
              href="#how"
              className="flex items-center gap-2.5 hover:bg-white/[.08]"
              style={{ fontSize: 15, fontWeight: 600, color: "#fff", background: "rgba(255,255,255,.04)", border: `1px solid ${C.line}`, padding: "13px 20px", borderRadius: 12 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#fff" strokeWidth="1.6" /><path d="M10 9l5 3-5 3V9Z" fill="#fff" /></svg>
              Watch Demo
            </a>
          </div>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <span style={{ width: 7, height: 7, borderRadius: 999, background: "#34D399", boxShadow: "0 0 10px #34D399" }} />
              <span style={{ fontSize: 12.5, color: C.tx3 }}>No resume required</span>
            </div>
            <span style={{ width: 1, height: 14, background: C.line }} />
            <span style={{ fontSize: 12.5, color: C.tx3 }}>
              Connects in <span style={{ color: C.tx2 }}>under 30 seconds</span>
            </span>
          </div>
        </div>

        <HeroPreview />
      </div>
    </section>
  );
}

function HeroPreview() {
  return (
    <div className="relative">
      <div className="absolute" style={{ inset: -1, borderRadius: 18, background: "linear-gradient(140deg,rgba(99,102,241,.4),rgba(139,92,246,.05) 40%,transparent 70%)", filter: "blur(2px)" }} />
      <div className="relative overflow-hidden" style={{ border: `1px solid ${C.line}`, borderRadius: 16, background: "linear-gradient(180deg,#0E0E12,#0A0A0D)", boxShadow: "0 30px 80px -20px rgba(0,0,0,.8)" }}>
        <div className="flex items-center gap-2" style={{ padding: "12px 16px", borderBottom: `1px solid ${C.line2}` }}>
          <div className="flex gap-1.5">
            <span style={{ width: 10, height: 10, borderRadius: 999, background: "#FB6E5E" }} />
            <span style={{ width: 10, height: 10, borderRadius: 999, background: "#F5BD4F" }} />
            <span style={{ width: 10, height: 10, borderRadius: 999, background: "#5FCB7E" }} />
          </div>
          <div className="flex-1 text-center" style={{ fontFamily: mono, fontSize: 11, color: C.tx3 }}>
            app.engineerdna.com/sarah-chen
          </div>
        </div>
        <div className="grid gap-3.5" style={{ padding: 18, gridTemplateColumns: "1.15fr 1fr" }}>
          <div style={{ border: `1px solid ${C.line2}`, borderRadius: 13, background: C.panel, padding: 16 }}>
            <div className="mb-1.5 flex items-center justify-between">
              <span style={{ fontSize: 11, color: C.tx3, letterSpacing: ".04em" }}>ENGINEERING SCORE</span>
              <span style={{ fontFamily: mono, fontSize: 10, color: "#34D399", background: "rgba(52,211,153,.12)", padding: "2px 7px", borderRadius: 999 }}>▲ Top 4%</span>
            </div>
            <div className="mb-3 flex items-baseline gap-1.5">
              <span style={{ fontFamily: mono, fontSize: 42, fontWeight: 700, letterSpacing: "-.03em", lineHeight: 1, background: "linear-gradient(120deg,#fff,#A5B4FC)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>847</span>
              <span style={{ fontFamily: mono, fontSize: 14, color: C.tx3 }}>/900</span>
            </div>
            <svg width="100%" viewBox="0 0 260 240" style={{ display: "block" }}>
              <polygon points="130,30 207.9,75 207.9,165 130,210 52.1,165 52.1,75" fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="1" />
              <polygon points="130,52 188.5,86 188.5,154 130,188 71.5,154 71.5,86" fill="none" stroke="rgba(255,255,255,.05)" strokeWidth="1" />
              <polygon points="130,37.2 190.8,84.9 196.2,158.25 130,183 61.4,159.6 56,77.25" fill="rgba(99,102,241,.18)" stroke="#8B5CF6" strokeWidth="1.6" />
              <g fill="#fff">
                <circle cx="130" cy="37.2" r="2.4" /><circle cx="190.8" cy="84.9" r="2.4" /><circle cx="196.2" cy="158.25" r="2.4" /><circle cx="130" cy="183" r="2.4" /><circle cx="61.4" cy="159.6" r="2.4" /><circle cx="56" cy="77.25" r="2.4" />
              </g>
              <g fontFamily={mono} fontSize="9" fill="#8E8E98" textAnchor="middle">
                <text x="130" y="20">SYS DESIGN</text>
                <text x="232" y="76">CODE</text>
                <text x="230" y="172">TESTS</text>
                <text x="130" y="228">ALGO</text>
                <text x="34" y="172">COLLAB</text>
                <text x="32" y="76">SHIP</text>
              </g>
            </svg>
          </div>
          <div className="flex flex-col gap-3.5">
            <div style={{ border: `1px solid ${C.line2}`, borderRadius: 13, background: C.panel, padding: 14 }}>
              <span style={{ fontSize: 11, color: C.tx3, letterSpacing: ".04em" }}>VERIFIED SKILLS</span>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {[["TypeScript", C.indText, "rgba(99,102,241,.12)", "rgba(99,102,241,.2)"], ["React", C.indText, "rgba(99,102,241,.12)", "rgba(99,102,241,.2)"], ["Go", C.grnText, "rgba(52,211,153,.12)", "rgba(52,211,153,.2)"], ["Postgres", C.indText, "rgba(99,102,241,.12)", "rgba(99,102,241,.2)"], ["+9", C.tx2, "rgba(255,255,255,.05)", C.line]].map(([t, col, bg, bd]) => (
                  <span key={t} style={{ fontFamily: mono, fontSize: 11, color: col, background: bg, border: `1px solid ${bd}`, padding: "4px 9px", borderRadius: 7 }}>{t}</span>
                ))}
              </div>
            </div>
            <div className="flex-1" style={{ border: `1px solid ${C.line2}`, borderRadius: 13, background: C.panel, padding: 14 }}>
              <span style={{ fontSize: 11, color: C.tx3, letterSpacing: ".04em" }}>PROJECT QUALITY</span>
              <div className="mt-3 flex flex-col gap-2.5">
                {[["Architecture", 92, "linear-gradient(90deg,#6366F1,#8B5CF6)"], ["Test Coverage", 78, "linear-gradient(90deg,#34D399,#10B981)"], ["Documentation", 85, "linear-gradient(90deg,#6366F1,#8B5CF6)"]].map(([label, val, grad]) => (
                  <div key={label as string}>
                    <div className="mb-1.5 flex justify-between" style={{ fontSize: 11.5 }}>
                      <span style={{ color: C.tx2 }}>{label}</span>
                      <span style={{ fontFamily: mono, color: "#fff" }}>{val}</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,.06)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${val}%`, background: grad as string, borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3.5" style={{ padding: "0 18px 18px" }}>
          {[["128 repositories analyzed", "2.4M lines · 6 languages", "rgba(99,102,241,.14)"], ["14 skills verified", "Backed by real commits", "rgba(52,211,153,.14)"]].map(([t, s, bg]) => (
            <div key={t} className="flex flex-1 items-center gap-3" style={{ border: `1px solid ${C.line2}`, borderRadius: 11, background: C.panel, padding: "12px 14px" }}>
              <div className="flex items-center justify-center" style={{ width: 30, height: 30, borderRadius: 8, background: bg }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="#6EE7B7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{t}</div>
                <div style={{ fontSize: 10.5, color: C.tx3 }}>{s}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- TRUSTED BY ---------------- */
function TrustedBy() {
  const cos = ["Google", "Microsoft", "amazon", "Meta", "NETFLIX", "Adobe", "airbnb", "Stripe"];
  return (
    <section className="mx-auto max-w-[1180px]" style={{ padding: "30px 40px 70px", borderTop: `1px solid ${C.line2}` }}>
      <p className="text-center" style={{ fontFamily: mono, fontSize: 11, letterSpacing: ".14em", color: C.tx3, margin: "0 0 26px" }}>
        WHERE ENGINEERDNA-VERIFIED TALENT IS HEADED
      </p>
      <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-5" style={{ opacity: 0.62 }}>
        {cos.map((c) => (
          <span key={c} style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.02em", color: "#D4D4D8" }}>{c}</span>
        ))}
      </div>
    </section>
  );
}

/* ---------------- PROBLEM ---------------- */
const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: ".12em", color: C.indText }}>{children}</span>
);
const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-.03em", margin: "16px 0 0", lineHeight: 1.08 }}>{children}</h2>
);

function Problem() {
  return (
    <section className="mx-auto max-w-[1180px]" style={{ padding: "70px 40px" }}>
      <div className="mx-auto text-center" style={{ maxWidth: 680, marginBottom: 50 }}>
        <Eyebrow>THE PROBLEM</Eyebrow>
        <h2 style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-.03em", margin: "16px 0 18px", lineHeight: 1.08 }}>Hiring is built on claims.</h2>
        <p style={{ fontSize: 17, lineHeight: 1.6, color: C.tx2, margin: 0 }}>
          A resume lists technologies without a shred of proof. Recruiters burn hours validating candidates they can&apos;t
          verify. And talented students have no way to show what they can actually build.
        </p>
      </div>
      <div className="mx-auto grid items-stretch lg:grid-cols-[1fr_auto_1fr]" style={{ maxWidth: 980, gap: 0 }}>
        <div style={{ border: `1px solid ${C.line}`, borderRadius: 16, background: "linear-gradient(180deg,#101013,#0B0B0E)", padding: 26 }}>
          <div className="mb-5 flex items-center gap-2.5">
            <div className="flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(255,255,255,.05)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 3h8l4 4v14H6V3Z" stroke="#71717A" strokeWidth="1.6" strokeLinejoin="round" /><path d="M14 3v4h4M9 13h6M9 17h4" stroke="#71717A" strokeWidth="1.6" strokeLinecap="round" /></svg>
            </div>
            <span style={{ fontSize: 15, fontWeight: 600, color: C.tx2 }}>Traditional Resume</span>
          </div>
          <div className="flex flex-col gap-3">
            <span style={{ color: "#71717A", fontSize: 15 }}>&quot;Proficient in React, Node, AWS&quot;</span>
            {["No evidence behind any skill", "Keyword-matched, easily gamed", "Hours of manual screening"].map((t) => (
              <div key={t} className="flex items-center gap-2.5" style={{ fontSize: 13.5, color: "#71717A" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#71717A" strokeWidth="1.5" /><path d="M9 9l6 6M15 9l-6 6" stroke="#71717A" strokeWidth="1.5" strokeLinecap="round" /></svg>
                {t}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-center" style={{ padding: "0 22px" }}>
          <span className="flex items-center justify-center" style={{ fontFamily: mono, fontSize: 12, color: C.tx3, border: `1px solid ${C.line}`, borderRadius: 999, width: 42, height: 42, background: C.bg }}>vs</span>
        </div>
        <div style={{ border: "1px solid rgba(99,102,241,.3)", borderRadius: 16, background: "linear-gradient(180deg,rgba(99,102,241,.08),rgba(139,92,246,.02))", padding: 26, boxShadow: "0 0 50px -20px rgba(99,102,241,.5)" }}>
          <div className="mb-5 flex items-center gap-2.5">
            <Brand size={32} />
            <span style={{ fontSize: 15, fontWeight: 600 }}>EngineerDNA Verified Profile</span>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {[["React · 92", C.indText, "rgba(99,102,241,.14)", "rgba(99,102,241,.25)"], ["Node · 88", C.grnText, "rgba(52,211,153,.12)", "rgba(52,211,153,.22)"], ["AWS · 81", C.indText, "rgba(99,102,241,.14)", "rgba(99,102,241,.25)"]].map(([t, col, bg, bd]) => (
                <span key={t} style={{ fontFamily: mono, fontSize: 12, color: col, background: bg, border: `1px solid ${bd}`, padding: "3px 8px", borderRadius: 6 }}>{t}</span>
              ))}
            </div>
            {["Every skill backed by real commits", "Scored from analyzed code, not words", "Screened in seconds, with confidence"].map((t) => (
              <div key={t} className="flex items-center gap-2.5" style={{ fontSize: 13.5, color: C.tx }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="#6EE7B7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- HOW IT WORKS ---------------- */
function HowItWorks() {
  const steps = [
    { n: "01", title: "Connect GitHub", body: "Securely link your repositories in one click. Read-only, revoke anytime.", icon: <GitHubIcon size={19} fill={C.indText} />, bg: "rgba(99,102,241,.12)", bd: "rgba(99,102,241,.2)" },
    { n: "02", title: "Analyze Evidence", body: "Our engine reads commits, architecture, tests and review history across every repo.", icon: <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M4 18V9M9 18V5M14 18v-6M19 18v-9" stroke="#A5B4FC" strokeWidth="2" strokeLinecap="round" /></svg>, bg: "rgba(99,102,241,.12)", bd: "rgba(99,102,241,.2)" },
    { n: "03", title: "Generate Developer DNA", body: "A verified profile of skills, scores and engineering strengths — built automatically.", icon: <DnaIcon size={19} stroke={C.vioText} />, bg: "rgba(139,92,246,.12)", bd: "rgba(139,92,246,.2)" },
    { n: "04", title: "Get Verified & Discovered", body: "Recruiters find you by proven ability. Students get a roadmap to grow.", icon: <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="#6EE7B7" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>, bg: "rgba(52,211,153,.12)", bd: "rgba(52,211,153,.2)" },
  ];
  return (
    <section id="how" className="mx-auto max-w-[1180px]" style={{ padding: "70px 40px 80px" }}>
      <div className="text-center" style={{ marginBottom: 50 }}>
        <Eyebrow>HOW IT WORKS</Eyebrow>
        <H2>From code to verified DNA<br />in four steps.</H2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s) => (
          <div key={s.n} style={{ border: `1px solid ${C.line}`, borderRadius: 16, background: "linear-gradient(180deg,#101013,#0B0B0E)", padding: 24 }}>
            <div className="mb-6 flex items-center justify-between">
              <span style={{ fontFamily: mono, fontSize: 12, color: C.tx3 }}>{s.n}</span>
              <div className="flex items-center justify-center" style={{ width: 38, height: 38, borderRadius: 11, background: s.bg, border: `1px solid ${s.bd}` }}>{s.icon}</div>
            </div>
            <h3 style={{ fontSize: 16.5, fontWeight: 700, margin: "0 0 8px", letterSpacing: "-.01em" }}>{s.title}</h3>
            <p style={{ fontSize: 13.5, lineHeight: 1.55, color: C.tx2, margin: 0 }}>{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- FEATURES ---------------- */
function Features() {
  const features = [
    { t: "Repository Intelligence", d: "Deep analysis of architecture, structure and code health across every repo.", bg: "rgba(99,102,241,.12)" },
    { t: "Developer DNA", d: "A multi-dimensional fingerprint of how you build, ship and collaborate.", bg: "rgba(139,92,246,.12)" },
    { t: "Verified Skills", d: "Every skill scored and backed by real commits — never self-reported.", bg: "rgba(52,211,153,.12)" },
    { t: "Engineering Timeline", d: "See growth over time — from first commit to production systems.", bg: "rgba(99,102,241,.12)" },
    { t: "Career Intelligence", d: "Personalized roadmaps and role matches based on your real strengths.", bg: "rgba(251,146,60,.12)" },
    { t: "AI Interview Prep", d: "Practice questions tailored to your code, your gaps and your target roles.", bg: "rgba(139,92,246,.12)" },
    { t: "Project Quality Analysis", d: "Architecture, testing and documentation scored on every project.", bg: "rgba(52,211,153,.12)" },
    { t: "Recruiter Dashboard", d: "Search verified talent by proven skill, not keywords.", bg: "rgba(99,102,241,.12)" },
  ];
  return (
    <section id="features" className="mx-auto max-w-[1180px] scroll-mt-20" style={{ padding: "70px 40px" }}>
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>PLATFORM</Eyebrow>
          <H2>Everything you need to<br />prove engineering ability.</H2>
        </div>
        <p style={{ fontSize: 15, color: C.tx2, maxWidth: 300, margin: "0 0 6px" }}>
          Eight systems working together to turn raw code into a profile recruiters can trust.
        </p>
      </div>
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div key={f.t} className="transition-colors hover:border-[rgba(99,102,241,.3)]" style={{ border: `1px solid ${C.line}`, borderRadius: 15, background: "linear-gradient(180deg,#101013,#0B0B0E)", padding: 22 }}>
            <div className="mb-[18px] flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 10, background: f.bg }}>
              <DnaIcon size={18} stroke={C.indText} w={1.8} />
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 7px", letterSpacing: "-.01em" }}>{f.t}</h3>
            <p style={{ fontSize: 13, lineHeight: 1.5, color: C.tx2, margin: 0 }}>{f.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- SHOWCASE ---------------- */
function Showcase() {
  return (
    <section id="showcase" className="mx-auto max-w-[1180px] overflow-hidden scroll-mt-20" style={{ padding: "70px 40px 90px" }}>
      <div className="text-center" style={{ marginBottom: 46 }}>
        <Eyebrow>THE PRODUCT</Eyebrow>
        <H2>One platform. Two sides of hiring.</H2>
      </div>
      <div className="relative mx-auto hidden md:block" style={{ height: 520, maxWidth: 1000 }}>
        {/* recruiter (back) */}
        <Link href="/connect" className="absolute overflow-hidden" style={{ top: 40, right: 0, width: 560, border: `1px solid ${C.line}`, borderRadius: 16, background: "linear-gradient(180deg,#101013,#0A0A0D)", boxShadow: "0 30px 70px -25px rgba(0,0,0,.9)", transform: "rotate(1.4deg)" }}>
          <div className="flex items-center justify-between" style={{ padding: "12px 16px", borderBottom: `1px solid ${C.line2}` }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: C.tx2 }}>Recruiter Dashboard</span>
            <span style={{ fontFamily: mono, fontSize: 10, color: C.indText, background: "rgba(99,102,241,.12)", padding: "2px 7px", borderRadius: 5 }}>SEARCH</span>
          </div>
          <div className="flex flex-col gap-2.5" style={{ padding: 14 }}>
            {[["Maya Rodriguez", "Backend · Distributed Systems", "872", "#6EE7B7", "linear-gradient(140deg,#6366F1,#8B5CF6)"], ["James Park", "Full-stack · React, Go", "816", "#6EE7B7", "linear-gradient(140deg,#3B82F6,#6366F1)"], ["Priya Nair", "ML · PyTorch, CUDA", "793", "#FBBF77", "linear-gradient(140deg,#8B5CF6,#A855F7)"]].map(([n, r, sc, col, grad]) => (
              <div key={n} className="flex items-center gap-2.5" style={{ border: `1px solid ${C.line2}`, borderRadius: 10, background: C.panel, padding: "10px 12px" }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: grad }} />
                <div className="flex-1">
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{n}</div>
                  <div style={{ fontSize: 10, color: C.tx3 }}>{r}</div>
                </div>
                <span style={{ fontFamily: mono, fontSize: 13, color: col }}>{sc}</span>
              </div>
            ))}
          </div>
        </Link>
        {/* student (front) */}
        <Link href="/connect" className="absolute overflow-hidden" style={{ bottom: 0, left: 0, width: 540, border: "1px solid rgba(99,102,241,.22)", borderRadius: 16, background: "linear-gradient(180deg,#101015,#0A0A0D)", boxShadow: "0 40px 90px -30px rgba(0,0,0,.95),0 0 60px -30px rgba(99,102,241,.4)", transform: "rotate(-1.2deg)" }}>
          <div className="flex items-center justify-between" style={{ padding: "12px 16px", borderBottom: `1px solid ${C.line2}` }}>
            <span style={{ fontSize: 12.5, fontWeight: 600 }}>Student Dashboard · Developer DNA</span>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: "#34D399" }} />
          </div>
          <div className="grid gap-3" style={{ padding: 16, gridTemplateColumns: "1fr 1fr" }}>
            <div style={{ border: `1px solid ${C.line2}`, borderRadius: 11, background: C.panel, padding: 14 }}>
              <div style={{ fontSize: 10, color: C.tx3, marginBottom: 6 }}>ENGINEERING SCORE</div>
              <div style={{ fontFamily: mono, fontSize: 30, fontWeight: 700, background: "linear-gradient(120deg,#fff,#A5B4FC)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>847</div>
              <div className="mt-2.5 flex items-end gap-1" style={{ height: 34 }}>
                {[40, 60, 50, 80, 70, 100].map((h, i) => (
                  <div key={i} style={{ flex: 1, height: `${h}%`, background: h === 100 ? "linear-gradient(180deg,#8B5CF6,#6366F1)" : `rgba(99,102,241,${0.4 + i * 0.05})`, borderRadius: 2 }} />
                ))}
              </div>
            </div>
            <div style={{ border: `1px solid ${C.line2}`, borderRadius: 11, background: C.panel, padding: 14 }}>
              <div style={{ fontSize: 10, color: C.tx3, marginBottom: 10 }}>TOP STRENGTHS</div>
              <div className="flex flex-col gap-2.5">
                {[["System Design", 94, "linear-gradient(90deg,#6366F1,#8B5CF6)"], ["Code Quality", 89, "linear-gradient(90deg,#6366F1,#8B5CF6)"], ["Velocity", 91, "linear-gradient(90deg,#34D399,#10B981)"]].map(([l, v, g]) => (
                  <div key={l as string}>
                    <div className="mb-1 flex justify-between" style={{ fontSize: 10.5 }}>
                      <span style={{ color: C.tx2 }}>{l}</span>
                      <span style={{ fontFamily: mono, color: "#fff" }}>{v}</span>
                    </div>
                    <div style={{ height: 4, background: "rgba(255,255,255,.06)", borderRadius: 2 }}>
                      <div style={{ width: `${v}%`, height: "100%", background: g as string, borderRadius: 2 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Link>
        <div className="absolute flex flex-col items-end gap-2" style={{ bottom: 24, right: 30 }}>
          {["Repository Report", "Career Intelligence"].map((t) => (
            <span key={t} style={{ fontFamily: mono, fontSize: 10.5, color: C.tx3, background: C.bg, border: `1px solid ${C.line}`, padding: "5px 10px", borderRadius: 7 }}>{t}</span>
          ))}
        </div>
      </div>
      {/* mobile fallback */}
      <div className="grid gap-4 md:hidden">
        <Link href="/connect" className="rounded-2xl p-5" style={{ border: `1px solid ${C.line}`, background: C.panel }}>
          <p style={{ fontSize: 13, fontWeight: 600 }}>Student Dashboard · Developer DNA</p>
          <p style={{ fontSize: 30, fontFamily: mono, fontWeight: 700, color: C.indText }}>847</p>
        </Link>
        <Link href="/connect" className="rounded-2xl p-5" style={{ border: `1px solid ${C.line}`, background: C.panel }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.tx2 }}>Recruiter Dashboard</p>
          <p style={{ fontSize: 12, color: C.tx3 }}>Search verified talent by proven skill.</p>
        </Link>
      </div>
      <p className="text-center" style={{ fontSize: 13, color: C.tx3, margin: "18px 0 0" }}>Click any panel to explore the live product →</p>
    </section>
  );
}

/* ---------------- WHY / COMPARISON ---------------- */
function WhyComparison() {
  const Check = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="#6EE7B7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  const Cross = () => <span style={{ color: C.tx3, fontSize: 16 }}>—</span>;
  const Partial = () => <span style={{ width: 7, height: 7, borderRadius: 999, background: "#FB923C", display: "inline-block" }} />;
  const cell = (v: "y" | "n" | "p") => (v === "y" ? <Check /> : v === "p" ? <Partial /> : <Cross />);

  const rows: [string, "y" | "n" | "p", "y" | "n" | "p", "y" | "n" | "p"][] = [
    ["Lists your skills", "y", "y", "p"],
    ["Backed by real code", "n", "n", "p"],
    ["Skills scored & ranked", "n", "n", "n"],
    ["Project quality analysis", "n", "n", "n"],
    ["Architecture & test signals", "n", "n", "p"],
    ["Engineering timeline", "n", "p", "p"],
    ["Recruiter-ready in seconds", "n", "p", "n"],
  ];

  return (
    <section className="mx-auto max-w-[1080px]" style={{ padding: "70px 40px" }}>
      <div className="text-center" style={{ marginBottom: 46 }}>
        <Eyebrow>WHY ENGINEERDNA</Eyebrow>
        <H2>The only profile built on evidence.</H2>
      </div>
      <div style={{ border: `1px solid ${C.line}`, borderRadius: 18, overflow: "hidden", background: "linear-gradient(180deg,#0E0E12,#0A0A0D)" }}>
        <div className="grid" style={{ gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1.1fr", alignItems: "stretch" }}>
          <div style={{ padding: "18px 22px", borderBottom: `1px solid ${C.line}` }} />
          {["Resume", "LinkedIn", "GitHub"].map((h) => (
            <div key={h} className="text-center" style={{ padding: "18px 12px", borderBottom: `1px solid ${C.line}`, fontSize: 13, fontWeight: 600, color: C.tx2 }}>{h}</div>
          ))}
          <div className="flex items-center justify-center gap-2" style={{ padding: "18px 12px", borderBottom: "1px solid rgba(99,102,241,.3)", background: "rgba(99,102,241,.08)" }}>
            <Brand size={18} />
            <span style={{ fontSize: 13, fontWeight: 700 }}>EngineerDNA</span>
          </div>
          {rows.map(([label, a, b, c], i) => (
            <div key={label} className="contents">
              <div className="flex items-center" style={{ padding: "15px 22px", borderBottom: i === rows.length - 1 ? "none" : `1px solid ${C.line2}`, fontSize: 13.5, color: C.tx }}>{label}</div>
              <div className="flex items-center justify-center" style={{ padding: "15px 12px", borderBottom: i === rows.length - 1 ? "none" : `1px solid ${C.line2}` }}>{cell(a)}</div>
              <div className="flex items-center justify-center" style={{ padding: "15px 12px", borderBottom: i === rows.length - 1 ? "none" : `1px solid ${C.line2}` }}>{cell(b)}</div>
              <div className="flex items-center justify-center" style={{ padding: "15px 12px", borderBottom: i === rows.length - 1 ? "none" : `1px solid ${C.line2}` }}>{cell(c)}</div>
              <div className="flex items-center justify-center" style={{ padding: "15px 12px", borderBottom: i === rows.length - 1 ? "none" : "1px solid rgba(99,102,241,.12)", background: "rgba(99,102,241,.06)" }}><Check /></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- TESTIMONIALS ---------------- */
function Testimonials() {
  const quotes = [
    { q: "I had no internships and a thin resume. EngineerDNA scored my side projects and three recruiters reached out in a week. My code finally spoke for itself.", in: "AK", name: "Aditya Kumar", role: "CS Student · Final Year", grad: "linear-gradient(140deg,#6366F1,#8B5CF6)" },
    { q: "As a self-taught engineer, credentials were always the barrier. My Engineering Score put me in the same room as CS grads — based on what I actually shipped.", in: "ST", name: "Sara Thompson", role: "Software Engineer · Fintech", grad: "linear-gradient(140deg,#34D399,#10B981)" },
    { q: "We cut technical screening time by 60%. Instead of guessing from resumes, my team opens a verified profile and sees exactly what someone can build.", in: "DM", name: "Daniel Mehta", role: "Technical Recruiter · Series B", grad: "linear-gradient(140deg,#FB923C,#F97316)" },
  ];
  return (
    <section className="mx-auto max-w-[1180px]" style={{ padding: "70px 40px" }}>
      <div className="text-center" style={{ marginBottom: 46 }}>
        <Eyebrow>TRUSTED BY ENGINEERS</Eyebrow>
        <H2>Proof, not promises.</H2>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {quotes.map((t) => (
          <div key={t.name} className="flex flex-col gap-[18px]" style={{ border: `1px solid ${C.line}`, borderRadius: 16, background: "linear-gradient(180deg,#101013,#0B0B0E)", padding: 26 }}>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: C.tx, margin: 0 }}>&quot;{t.q}&quot;</p>
            <div className="mt-auto flex items-center gap-3">
              <div className="flex items-center justify-center" style={{ width: 42, height: 42, borderRadius: 999, background: t.grad, fontWeight: 700, fontSize: 15 }}>{t.in}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{t.name}</div>
                <div style={{ fontSize: 12, color: C.tx3 }}>{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- FINAL CTA ---------------- */
function FinalCta() {
  return (
    <section className="mx-auto max-w-[1180px]" style={{ padding: "80px 40px 90px" }}>
      <div className="relative overflow-hidden text-center" style={{ border: "1px solid rgba(99,102,241,.25)", borderRadius: 24, background: "radial-gradient(120% 140% at 50% 0%,rgba(99,102,241,.16),rgba(139,92,246,.04) 45%,#0A0A0D 75%)", padding: "70px 40px" }}>
        <div className="pointer-events-none absolute" style={{ top: -80, left: "50%", transform: "translateX(-50%)", width: 500, height: 300, background: "radial-gradient(circle,rgba(99,102,241,.25),transparent 65%)", filter: "blur(10px)" }} />
        <h2 className="relative" style={{ fontSize: 50, fontWeight: 900, letterSpacing: "-.035em", lineHeight: 1.04, margin: "0 0 18px", textWrap: "balance" } as React.CSSProperties}>
          Stop listing skills.<br />Start proving them.
        </h2>
        <p className="relative mx-auto" style={{ fontSize: 17, color: C.tx2, maxWidth: 480, margin: "0 auto 32px" }}>
          Connect your GitHub and watch your Engineering DNA build itself in under a minute.
        </p>
        <div className="relative flex items-center justify-center gap-3">
          <Link href="/connect" style={{ fontSize: 15, fontWeight: 600, color: "#fff", background: "linear-gradient(140deg,#6366F1,#7C5CF6)", padding: "14px 24px", borderRadius: 12, boxShadow: "0 8px 28px rgba(99,102,241,.4)" }}>
            Create Your Engineering DNA
          </Link>
          <a href="#" style={{ fontSize: 15, fontWeight: 600, color: "#fff", background: "rgba(255,255,255,.04)", border: `1px solid ${C.line}`, padding: "14px 22px", borderRadius: 12 }}>
            Schedule Demo
          </a>
        </div>
      </div>
    </section>
  );
}

/* ---------------- FOOTER ---------------- */
function Footer() {
  const cols = [
    { h: "PRODUCT", items: ["Features", "For Students", "For Recruiters", "Pricing"] },
    { h: "RESOURCES", items: ["Blog", "Documentation", "API", "Careers"] },
    { h: "COMPANY", items: ["About", "Contact", "Privacy", "Terms"] },
  ];
  return (
    <footer style={{ borderTop: `1px solid ${C.line2}`, padding: "56px 40px 40px" }}>
      <div className="mx-auto grid max-w-[1180px] gap-10 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div>
          <div className="mb-3.5 flex items-center gap-2.5">
            <Brand size={26} />
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-.02em" }}>EngineerDNA</span>
          </div>
          <p style={{ fontSize: 13.5, color: C.tx3, lineHeight: 1.55, margin: "0 0 18px", maxWidth: 260 }}>
            The trust layer between developers and recruiters. Evidence over claims.
          </p>
        </div>
        {cols.map((c) => (
          <div key={c.h}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.tx3, letterSpacing: ".06em", marginBottom: 16 }}>{c.h}</div>
            <div className="flex flex-col gap-3">
              {c.items.map((i) => (
                <span key={i} className="cursor-pointer hover:text-white" style={{ fontSize: 13.5, color: C.tx2 }}>{i}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-10 flex max-w-[1180px] flex-wrap items-center justify-between gap-3 pt-6" style={{ borderTop: `1px solid ${C.line2}` }}>
        <span style={{ fontSize: 12.5, color: C.tx3 }}>© 2026 EngineerDNA, Inc. All rights reserved.</span>
        <span style={{ fontFamily: mono, fontSize: 11.5, color: C.tx3 }}>Built for engineers, by engineers.</span>
      </div>
    </footer>
  );
}
