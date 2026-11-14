import Link from "next/link";
import { RedirectIfAuthed } from "@/components/auth/RedirectIfAuthed";
import { CountUp, Reveal } from "@/components/landing/Motion";

/* Exact design tokens from the provided EngineerDNA design. */
const C = {
  bg: "#09090B",
  panel: "#141417",
  line: "rgba(255,255,255,.08)",
  line2: "rgba(255,255,255,.05)",
  tx: "#FAFAFA",
  tx2: "#A1A1AA",
  tx3: "#8E8E99",
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
    <RedirectIfAuthed>
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
    </RedirectIfAuthed>
  );
}

/* ---------------- NAV ---------------- */
function Nav() {
  const links: { label: string; href: string }[] = [
    { label: "Product", href: "#how" },
    { label: "Features", href: "#features" },
    { label: "Students", href: "/dashboard" },
    { label: "Recruiters", href: "/recruiter/login" },
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
      <div className="relative grid items-center gap-14 lg:grid-cols-[1fr_1.02fr]">
        <div>
          <div
            className="mb-7 inline-flex items-center gap-2"
            style={{ padding: "6px 12px 6px 8px", border: `1px solid ${C.line}`, borderRadius: 999, background: "rgba(255,255,255,.02)" }}
          >
            <span style={{ fontFamily: mono, fontSize: 10.5, fontWeight: 600, letterSpacing: ".06em", color: "#fff", background: "linear-gradient(140deg,#6366F1,#8B5CF6)", padding: "3px 7px", borderRadius: 999 }}>
              NEW
            </span>
            <span style={{ fontSize: 12.5, color: C.tx2 }}>Verified engineering profiles</span>
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(44px, 6vw, 70px)", lineHeight: 1.02, fontWeight: 500, letterSpacing: "-.015em", margin: "0 0 22px", textWrap: "balance" } as React.CSSProperties}>
            The Trust Layer for
            <br />
            Technical Hiring.
          </h1>
          <p style={{ fontSize: 17.5, lineHeight: 1.55, color: C.tx2, maxWidth: 460, margin: "0 0 34px" }}>
            Real code in. Verified skills out.
          </p>
          <div className="flex flex-wrap items-center gap-3">
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
              See how it works
            </a>
          </div>
        </div>

        <HeroPreview />
      </div>
    </section>
  );
}

/** The live-looking profile card: score counts up, radar blooms, bars fill, a scan line sweeps. */
function HeroPreview() {
  return (
    <div className="anim-float relative">
      <div className="anim-glow pointer-events-none absolute" style={{ inset: -40, borderRadius: 40, background: "radial-gradient(closest-side,rgba(99,102,241,.28),transparent)", filter: "blur(20px)" }} />
      <div className="absolute" style={{ inset: -1, borderRadius: 18, background: "linear-gradient(140deg,rgba(99,102,241,.4),rgba(139,92,246,.05) 40%,transparent 70%)", filter: "blur(2px)" }} />
      <div className="relative overflow-hidden" style={{ border: `1px solid ${C.line}`, borderRadius: 16, background: "linear-gradient(180deg,#0E0E12,#0A0A0D)", boxShadow: "0 30px 80px -20px rgba(0,0,0,.8)" }}>
        {/* scanning beam */}
        <div className="anim-scan pointer-events-none absolute left-0 right-0 z-10" style={{ top: 0, height: 80, background: "linear-gradient(180deg,transparent,rgba(99,102,241,.14) 70%,rgba(165,180,252,.5) 100%)" }} />
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
              <span className="anim-pop" style={{ animationDelay: "1.6s", fontFamily: mono, fontSize: 10, color: "#34D399", background: "rgba(52,211,153,.12)", padding: "2px 7px", borderRadius: 999 }}>▲ Top 4%</span>
            </div>
            <div className="mb-3 flex items-baseline gap-1.5">
              <CountUp to={847} style={{ fontFamily: mono, fontSize: 42, fontWeight: 700, letterSpacing: "-.03em", lineHeight: 1, background: "linear-gradient(120deg,#fff,#A5B4FC)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }} />
              <span style={{ fontFamily: mono, fontSize: 14, color: C.tx3 }}>/900</span>
            </div>
            <svg width="100%" viewBox="0 0 260 240" style={{ display: "block" }}>
              <polygon points="130,30 207.9,75 207.9,165 130,210 52.1,165 52.1,75" fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="1" />
              <polygon points="130,52 188.5,86 188.5,154 130,188 71.5,154 71.5,86" fill="none" stroke="rgba(255,255,255,.05)" strokeWidth="1" />
              <g className="anim-radar">
                <polygon points="130,37.2 190.8,84.9 196.2,158.25 130,183 61.4,159.6 56,77.25" fill="rgba(99,102,241,.18)" stroke="#8B5CF6" strokeWidth="1.6" />
                <g fill="#fff">
                  <circle cx="130" cy="37.2" r="2.4" /><circle cx="190.8" cy="84.9" r="2.4" /><circle cx="196.2" cy="158.25" r="2.4" /><circle cx="130" cy="183" r="2.4" /><circle cx="61.4" cy="159.6" r="2.4" /><circle cx="56" cy="77.25" r="2.4" />
                </g>
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
                {[["TypeScript", C.indText, "rgba(99,102,241,.12)", "rgba(99,102,241,.2)"], ["React", C.indText, "rgba(99,102,241,.12)", "rgba(99,102,241,.2)"], ["Go", C.grnText, "rgba(52,211,153,.12)", "rgba(52,211,153,.2)"], ["Postgres", C.indText, "rgba(99,102,241,.12)", "rgba(99,102,241,.2)"], ["+9", C.tx2, "rgba(255,255,255,.05)", C.line]].map(([t, col, bg, bd], i) => (
                  <span key={t} className="anim-pop" style={{ animationDelay: `${0.5 + i * 0.18}s`, fontFamily: mono, fontSize: 11, color: col, background: bg, border: `1px solid ${bd}`, padding: "4px 9px", borderRadius: 7 }}>{t}</span>
                ))}
              </div>
            </div>
            <div className="flex-1" style={{ border: `1px solid ${C.line2}`, borderRadius: 13, background: C.panel, padding: 14 }}>
              <span style={{ fontSize: 11, color: C.tx3, letterSpacing: ".04em" }}>PROJECT QUALITY</span>
              <div className="mt-3 flex flex-col gap-2.5">
                {[["Architecture", 92, "linear-gradient(90deg,#6366F1,#8B5CF6)"], ["Test Coverage", 78, "linear-gradient(90deg,#34D399,#10B981)"], ["Documentation", 85, "linear-gradient(90deg,#6366F1,#8B5CF6)"]].map(([label, val, grad], i) => (
                  <div key={label as string}>
                    <div className="mb-1.5 flex justify-between" style={{ fontSize: 11.5 }}>
                      <span style={{ color: C.tx2 }}>{label}</span>
                      <span style={{ fontFamily: mono, color: "#fff" }}>{val}</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,.06)", overflow: "hidden" }}>
                      <div className="anim-grow" style={{ animationDelay: `${0.8 + i * 0.25}s`, height: "100%", width: `${val}%`, background: grad as string, borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3.5" style={{ padding: "0 18px 18px" }}>
          {[["128 repos analyzed", "rgba(99,102,241,.14)"], ["14 skills verified", "rgba(52,211,153,.14)"]].map(([t, bg], i) => (
            <div key={t} className="anim-pop flex flex-1 items-center gap-3" style={{ animationDelay: `${1.8 + i * 0.3}s`, border: `1px solid ${C.line2}`, borderRadius: 11, background: C.panel, padding: "12px 14px" }}>
              <div className="flex items-center justify-center" style={{ width: 30, height: 30, borderRadius: 8, background: bg }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path className="anim-check" style={{ animationDelay: `${2.1 + i * 0.3}s` }} d="M5 12l4 4 10-10" stroke="#6EE7B7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 600 }}>{t}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- TRUSTED BY (scrolling marquee) ---------------- */
function TrustedBy() {
  const cos = ["Google", "Microsoft", "amazon", "Meta", "NETFLIX", "Adobe", "airbnb", "Stripe"];
  return (
    <section className="mx-auto max-w-[1180px]" style={{ padding: "30px 0 70px", borderTop: `1px solid ${C.line2}` }}>
      <p className="eyebrow text-center" style={{ color: C.tx3, margin: "0 0 26px" }}>
        Where verified talent is headed
      </p>
      <div className="mask-fade-x overflow-hidden">
        <div className="anim-marquee flex w-max items-center" style={{ opacity: 0.62 }}>
          {[...cos, ...cos].map((c, i) => (
            <span key={i} style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.02em", color: "#D4D4D8", padding: "0 30px" }}>{c}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- shared heading bits ---------------- */
const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <span className="eyebrow" style={{ color: C.indText }}>{children}</span>
);
const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(34px, 4.4vw, 50px)", fontWeight: 500, letterSpacing: "-.012em", margin: "16px 0 0", lineHeight: 1.08 }}>{children}</h2>
);
const SectionHead = ({ eyebrow, title }: { eyebrow: string; title: React.ReactNode }) => (
  <div className="text-center" style={{ marginBottom: 50 }}>
    <Eyebrow>{eyebrow}</Eyebrow>
    <H2>{title}</H2>
  </div>
);

/* ---------------- PROBLEM: resume claims dissolve into verified evidence ---------------- */
function Problem() {
  return (
    <section className="mx-auto max-w-[1180px]" style={{ padding: "70px 40px" }}>
      <Reveal>
        <SectionHead eyebrow="The problem" title="Hiring is built on claims." />
        <div className="mx-auto grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr] lg:gap-0" style={{ maxWidth: 940 }}>
          {/* resume: claims blur out and get struck through */}
          <div style={{ border: `1px solid ${C.line}`, borderRadius: 16, background: "linear-gradient(180deg,#101013,#0B0B0E)", padding: 26 }}>
            <div className="mb-6 flex items-center gap-2.5">
              <div className="flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(255,255,255,.05)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 3h8l4 4v14H6V3Z" stroke="#71717A" strokeWidth="1.6" strokeLinejoin="round" /><path d="M14 3v4h4M9 13h6M9 17h4" stroke="#71717A" strokeWidth="1.6" strokeLinecap="round" /></svg>
              </div>
              <span style={{ fontSize: 15, fontWeight: 600, color: C.tx2 }}>Resume</span>
            </div>
            <div className="flex flex-col gap-3.5">
              {["Proficient in React", "Expert in Node.js", "AWS certified mindset"].map((t, i) => (
                <div key={t} className="relative w-fit">
                  <span className="anim-fade-blur" style={{ animationDelay: `${i * 0.4}s`, display: "inline-block", color: "#8E8E99", fontSize: 15 }}>&quot;{t}&quot;</span>
                  <span className="anim-strike absolute left-0 right-0" style={{ animationDelay: `${1 + i * 0.35}s`, top: "52%", height: 1.5, background: "#F87171" }} />
                </div>
              ))}
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ height: 8, width: `${80 - i * 18}%`, borderRadius: 4, background: "rgba(255,255,255,.05)" }} />
              ))}
            </div>
          </div>

          {/* flowing particles between the cards */}
          <div className="flex items-center justify-center" style={{ padding: "0 22px" }}>
            <div className="relative flex items-center justify-center overflow-hidden" style={{ width: 52, height: 52, borderRadius: 999, border: `1px solid ${C.line}`, background: C.bg }}>
              {[0, 1, 2].map((i) => (
                <span key={i} className="anim-flow absolute" style={{ animationDelay: `${i * 0.5}s`, left: 8, width: 6, height: 6, borderRadius: 999, background: "#A5B4FC", boxShadow: "0 0 10px #6366F1" }} />
              ))}
            </div>
          </div>

          {/* verified profile: chips pop in, bars fill */}
          <div style={{ border: "1px solid rgba(99,102,241,.3)", borderRadius: 16, background: "linear-gradient(180deg,rgba(99,102,241,.08),rgba(139,92,246,.02))", padding: 26, boxShadow: "0 0 50px -20px rgba(99,102,241,.5)" }}>
            <div className="mb-6 flex items-center gap-2.5">
              <Brand size={32} />
              <span style={{ fontSize: 15, fontWeight: 600 }}>Verified Profile</span>
            </div>
            <div className="flex flex-col gap-3.5">
              {[["React", 92, "linear-gradient(90deg,#6366F1,#8B5CF6)"], ["Node", 88, "linear-gradient(90deg,#34D399,#10B981)"], ["AWS", 81, "linear-gradient(90deg,#6366F1,#8B5CF6)"]].map(([l, v, g], i) => (
                <div key={l as string} className="flex items-center gap-3">
                  <span className="anim-pop" style={{ animationDelay: `${1.2 + i * 0.3}s`, width: 58, fontFamily: mono, fontSize: 12, color: C.indText }}>{l}</span>
                  <div className="flex-1" style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,.06)", overflow: "hidden" }}>
                    <div className="anim-grow" style={{ animationDelay: `${1.3 + i * 0.3}s`, width: `${v}%`, height: "100%", background: g as string, borderRadius: 3 }} />
                  </div>
                  <span style={{ fontFamily: mono, fontSize: 12, color: "#fff" }}>{v}</span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path className="anim-check" style={{ animationDelay: `${1.7 + i * 0.3}s` }} d="M5 12l4 4 10-10" stroke="#6EE7B7" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ---------------- HOW IT WORKS: animated pipeline ---------------- */
function HowItWorks() {
  const steps = [
    { title: "Connect", icon: <GitHubIcon size={22} fill={C.indText} /> },
    { title: "Analyze", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 18V9M9 18V5M14 18v-6M19 18v-9" stroke="#A5B4FC" strokeWidth="2" strokeLinecap="round" /></svg> },
    { title: "Build DNA", icon: <DnaIcon size={22} stroke={C.vioText} /> },
    { title: "Get hired", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="#6EE7B7" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg> },
  ];
  return (
    <section id="how" className="mx-auto max-w-[1080px] scroll-mt-20" style={{ padding: "70px 40px 80px" }}>
      <Reveal>
        <SectionHead eyebrow="How it works" title="From code to verified DNA." />
        <div className="relative">
          {/* track + travelling light */}
          <div className="absolute hidden sm:block" style={{ top: 38, left: "12.5%", right: "12.5%", height: 2, background: "linear-gradient(90deg,rgba(99,102,241,.1),rgba(139,92,246,.35),rgba(52,211,153,.2))" }}>
            <span className="anim-comet absolute" style={{ top: -4, width: 60, height: 10, marginLeft: -30, borderRadius: 999, background: "radial-gradient(closest-side,#C7D2FE,rgba(99,102,241,.6),transparent)", filter: "blur(1px)" }} />
          </div>
          <div className="grid grid-cols-2 gap-y-10 sm:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s.title} className="relative flex flex-col items-center gap-4">
                <div
                  className="anim-node flex items-center justify-center"
                  style={{ animationDelay: `${i * 1}s`, width: 78, height: 78, borderRadius: 999, border: "1px solid rgba(255,255,255,.1)", background: "radial-gradient(circle at 50% 30%,#1A1A22,#0B0B0E)" }}
                >
                  {s.icon}
                </div>
                <span style={{ fontFamily: mono, fontSize: 11, color: C.tx3 }}>0{i + 1}</span>
                <span style={{ fontSize: 16, fontWeight: 600 }}>{s.title}</span>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ---------------- FEATURES: icon tiles, staggered in ---------------- */
function Features() {
  const features: [string, string][] = [
    ["Repository Intelligence", "rgba(99,102,241,.14)"],
    ["Developer DNA", "rgba(139,92,246,.14)"],
    ["Verified Skills", "rgba(52,211,153,.14)"],
    ["Engineering Timeline", "rgba(99,102,241,.14)"],
    ["Career Intelligence", "rgba(251,146,60,.14)"],
    ["AI Interview Prep", "rgba(139,92,246,.14)"],
    ["Project Quality", "rgba(52,211,153,.14)"],
    ["Recruiter Dashboard", "rgba(99,102,241,.14)"],
  ];
  return (
    <section id="features" className="mx-auto max-w-[1180px] scroll-mt-20" style={{ padding: "70px 40px" }}>
      <Reveal>
        <SectionHead eyebrow="Platform" title="Everything in one place." />
      </Reveal>
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {features.map(([t, bg], i) => (
          <Reveal key={t} delay={i * 70}>
            <div className="group flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(99,102,241,.4)] hover:shadow-[0_20px_50px_-25px_rgba(99,102,241,.6)]" style={{ border: `1px solid ${C.line}`, borderRadius: 15, background: "linear-gradient(180deg,#101013,#0B0B0E)", padding: "20px 22px" }}>
              <div className="flex shrink-0 items-center justify-center transition-transform duration-500 group-hover:rotate-180" style={{ width: 40, height: 40, borderRadius: 11, background: bg }}>
                <DnaIcon size={19} stroke={C.indText} w={1.8} />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, letterSpacing: "-.01em" }}>{t}</h3>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------------- SHOWCASE ---------------- */
function Showcase() {
  return (
    <section id="showcase" className="mx-auto max-w-[1180px] overflow-hidden scroll-mt-20" style={{ padding: "70px 40px 90px" }}>
      <Reveal>
        <SectionHead eyebrow="The product" title="Two sides of hiring." />
        <div className="relative mx-auto hidden md:block" style={{ height: 520, maxWidth: 1000 }}>
          {/* recruiter (back) */}
          <div className="anim-float absolute" style={{ top: 40, right: 0, animationDelay: "-3s" }}>
            <Link href="/connect" className="block overflow-hidden" style={{ width: 560, border: `1px solid ${C.line}`, borderRadius: 16, background: "linear-gradient(180deg,#101013,#0A0A0D)", boxShadow: "0 30px 70px -25px rgba(0,0,0,.9)", transform: "rotate(1.4deg)" }}>
              <div className="flex items-center justify-between" style={{ padding: "12px 16px", borderBottom: `1px solid ${C.line2}` }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: C.tx2 }}>Recruiter Dashboard</span>
                <span style={{ fontFamily: mono, fontSize: 10, color: C.indText, background: "rgba(99,102,241,.12)", padding: "2px 7px", borderRadius: 5 }}>SEARCH</span>
              </div>
              <div className="flex flex-col gap-2.5" style={{ padding: 14 }}>
                {[["Maya Rodriguez", "Backend · Distributed Systems", 872, "#6EE7B7", "linear-gradient(140deg,#6366F1,#8B5CF6)"], ["James Park", "Full-stack · React, Go", 816, "#6EE7B7", "linear-gradient(140deg,#3B82F6,#6366F1)"], ["Priya Nair", "ML · PyTorch, CUDA", 793, "#FBBF77", "linear-gradient(140deg,#8B5CF6,#A855F7)"]].map(([n, r, sc, col, grad], i) => (
                  <div key={n as string} className="anim-pop flex items-center gap-2.5" style={{ animationDelay: `${0.4 + i * 0.25}s`, border: `1px solid ${C.line2}`, borderRadius: 10, background: C.panel, padding: "10px 12px" }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: grad as string }} />
                    <div className="flex-1">
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{n}</div>
                      <div style={{ fontSize: 10, color: C.tx3 }}>{r}</div>
                    </div>
                    <CountUp to={sc as number} style={{ fontFamily: mono, fontSize: 13, color: col as string }} />
                  </div>
                ))}
              </div>
            </Link>
          </div>
          {/* student (front) */}
          <div className="anim-float absolute" style={{ bottom: 0, left: 0 }}>
            <Link href="/connect" className="block overflow-hidden" style={{ width: 540, border: "1px solid rgba(99,102,241,.22)", borderRadius: 16, background: "linear-gradient(180deg,#101015,#0A0A0D)", boxShadow: "0 40px 90px -30px rgba(0,0,0,.95),0 0 60px -30px rgba(99,102,241,.4)", transform: "rotate(-1.2deg)" }}>
              <div className="flex items-center justify-between" style={{ padding: "12px 16px", borderBottom: `1px solid ${C.line2}` }}>
                <span style={{ fontSize: 12.5, fontWeight: 600 }}>Student Dashboard · Developer DNA</span>
                <span className="anim-glow" style={{ width: 7, height: 7, borderRadius: 999, background: "#34D399", boxShadow: "0 0 8px #34D399" }} />
              </div>
              <div className="grid gap-3" style={{ padding: 16, gridTemplateColumns: "1fr 1fr" }}>
                <div style={{ border: `1px solid ${C.line2}`, borderRadius: 11, background: C.panel, padding: 14 }}>
                  <div style={{ fontSize: 10, color: C.tx3, marginBottom: 6 }}>ENGINEERING SCORE</div>
                  <CountUp to={847} style={{ fontFamily: mono, fontSize: 30, fontWeight: 700, background: "linear-gradient(120deg,#fff,#A5B4FC)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }} />
                  <div className="mt-2.5 flex items-end gap-1" style={{ height: 34 }}>
                    {[40, 60, 50, 80, 70, 100].map((h, i) => (
                      <div key={i} className="anim-pop" style={{ animationDelay: `${0.6 + i * 0.12}s`, flex: 1, height: `${h}%`, background: h === 100 ? "linear-gradient(180deg,#8B5CF6,#6366F1)" : `rgba(99,102,241,${0.4 + i * 0.05})`, borderRadius: 2, transformOrigin: "bottom" }} />
                    ))}
                  </div>
                </div>
                <div style={{ border: `1px solid ${C.line2}`, borderRadius: 11, background: C.panel, padding: 14 }}>
                  <div style={{ fontSize: 10, color: C.tx3, marginBottom: 10 }}>TOP STRENGTHS</div>
                  <div className="flex flex-col gap-2.5">
                    {[["System Design", 94, "linear-gradient(90deg,#6366F1,#8B5CF6)"], ["Code Quality", 89, "linear-gradient(90deg,#6366F1,#8B5CF6)"], ["Velocity", 91, "linear-gradient(90deg,#34D399,#10B981)"]].map(([l, v, g], i) => (
                      <div key={l as string}>
                        <div className="mb-1 flex justify-between" style={{ fontSize: 10.5 }}>
                          <span style={{ color: C.tx2 }}>{l}</span>
                          <span style={{ fontFamily: mono, color: "#fff" }}>{v}</span>
                        </div>
                        <div style={{ height: 4, background: "rgba(255,255,255,.06)", borderRadius: 2, overflow: "hidden" }}>
                          <div className="anim-grow" style={{ animationDelay: `${0.8 + i * 0.25}s`, width: `${v}%`, height: "100%", background: g as string, borderRadius: 2 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
        {/* mobile fallback */}
        <div className="grid gap-4 md:hidden">
          <Link href="/connect" className="rounded-2xl p-5" style={{ border: `1px solid ${C.line}`, background: C.panel }}>
            <p style={{ fontSize: 13, fontWeight: 600 }}>Student Dashboard</p>
            <CountUp to={847} style={{ fontSize: 30, fontFamily: mono, fontWeight: 700, color: C.indText }} />
          </Link>
          <Link href="/connect" className="rounded-2xl p-5" style={{ border: `1px solid ${C.line}`, background: C.panel }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.tx2 }}>Recruiter Dashboard</p>
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

/* ---------------- WHY / COMPARISON ---------------- */
function WhyComparison() {
  const Check = ({ d = 0 }: { d?: number }) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path className="anim-check" style={{ animationDelay: `${d}s` }} d="M5 12l4 4 10-10" stroke="#6EE7B7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  const Cross = () => <span style={{ color: C.tx3, fontSize: 16 }}>—</span>;
  const Partial = () => <span style={{ width: 7, height: 7, borderRadius: 999, background: "#FB923C", display: "inline-block" }} />;
  const cell = (v: "y" | "n" | "p") => (v === "y" ? <Check /> : v === "p" ? <Partial /> : <Cross />);

  const rows: [string, "y" | "n" | "p", "y" | "n" | "p", "y" | "n" | "p"][] = [
    ["Backed by real code", "n", "n", "p"],
    ["Skills scored", "n", "n", "n"],
    ["Project quality", "n", "n", "n"],
    ["Recruiter-ready", "n", "p", "n"],
  ];

  return (
    <section className="mx-auto max-w-[1000px]" style={{ padding: "70px 40px" }}>
      <Reveal>
        <SectionHead eyebrow="Why EngineerDNA" title="Built on evidence." />
        <div className="overflow-x-auto" style={{ border: `1px solid ${C.line}`, borderRadius: 18, background: "linear-gradient(180deg,#0E0E12,#0A0A0D)" }}>
          <div className="grid min-w-[560px]" style={{ gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1.1fr", alignItems: "stretch" }}>
            <div style={{ padding: "18px 22px", borderBottom: `1px solid ${C.line}` }} />
            {["Resume", "LinkedIn", "GitHub"].map((h) => (
              <div key={h} className="text-center" style={{ padding: "18px 12px", borderBottom: `1px solid ${C.line}`, fontSize: 13, fontWeight: 600, color: C.tx2 }}>{h}</div>
            ))}
            <div className="flex items-center justify-center gap-2" style={{ padding: "18px 12px", borderBottom: "1px solid rgba(99,102,241,.3)", background: "rgba(99,102,241,.08)" }}>
              <Brand size={18} />
              <span style={{ fontSize: 13, fontWeight: 700 }}>EngineerDNA</span>
            </div>
            {rows.map(([label, a, b, c], i) => {
              const bb = i === rows.length - 1 ? "none" : `1px solid ${C.line2}`;
              return (
                <div key={label} className="contents">
                  <div className="flex items-center" style={{ padding: "16px 22px", borderBottom: bb, fontSize: 14, color: C.tx }}>{label}</div>
                  <div className="flex items-center justify-center" style={{ padding: "16px 12px", borderBottom: bb }}>{cell(a)}</div>
                  <div className="flex items-center justify-center" style={{ padding: "16px 12px", borderBottom: bb }}>{cell(b)}</div>
                  <div className="flex items-center justify-center" style={{ padding: "16px 12px", borderBottom: bb }}>{cell(c)}</div>
                  <div className="flex items-center justify-center" style={{ padding: "16px 12px", borderBottom: i === rows.length - 1 ? "none" : "1px solid rgba(99,102,241,.12)", background: "rgba(99,102,241,.06)" }}><Check d={0.5 + i * 0.25} /></div>
                </div>
              );
            })}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ---------------- TESTIMONIALS: short quotes, auto-scrolling ---------------- */
function Testimonials() {
  const quotes = [
    { q: "My code finally spoke for itself.", in: "AK", name: "Aditya Kumar", role: "CS Student", grad: "linear-gradient(140deg,#6366F1,#8B5CF6)" },
    { q: "Judged on what I shipped, not my degree.", in: "ST", name: "Sara Thompson", role: "Software Engineer", grad: "linear-gradient(140deg,#34D399,#10B981)" },
    { q: "Screening time down 60%.", in: "DM", name: "Daniel Mehta", role: "Technical Recruiter", grad: "linear-gradient(140deg,#FB923C,#F97316)" },
    { q: "Three recruiters reached out in a week.", in: "RV", name: "Riya Verma", role: "Final-year Student", grad: "linear-gradient(140deg,#3B82F6,#6366F1)" },
  ];
  return (
    <section className="mx-auto max-w-[1180px]" style={{ padding: "70px 0" }}>
      <Reveal>
        <SectionHead eyebrow="Trusted by engineers" title="Proof, not promises." />
        <div className="mask-fade-x overflow-hidden">
          <div className="anim-marquee-slow flex w-max gap-4" style={{ padding: "0 8px" }}>
            {[...quotes, ...quotes].map((t, i) => (
              <div key={i} className="flex shrink-0 flex-col gap-5" style={{ width: 340, border: `1px solid ${C.line}`, borderRadius: 16, background: "linear-gradient(180deg,#101013,#0B0B0E)", padding: 24 }}>
                <p style={{ fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 1.3, color: C.tx, margin: 0 }}>&ldquo;{t.q}&rdquo;</p>
                <div className="mt-auto flex items-center gap-3">
                  <div className="flex items-center justify-center" style={{ width: 38, height: 38, borderRadius: 999, background: t.grad, fontWeight: 700, fontSize: 13 }}>{t.in}</div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: C.tx3 }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ---------------- FINAL CTA: animated DNA helix behind the headline ---------------- */
function Helix() {
  const n = 26;
  const w = 1000;
  const cy = 60;
  const amp = 42;
  const dur = 3.2;
  return (
    <svg className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" width="1000" height="120" viewBox={`0 0 ${w} 120`} style={{ opacity: 0.55, maxWidth: "none" }} aria-hidden>
      {Array.from({ length: n }).map((_, i) => {
        const x = 20 + (i * (w - 40)) / (n - 1);
        const begin = `${-(i * dur) / 13}s`;
        const up = `${cy - amp};${cy + amp};${cy - amp}`;
        const down = `${cy + amp};${cy - amp};${cy + amp}`;
        const spline = { calcMode: "spline", keyTimes: "0;0.5;1", keySplines: "0.45 0 0.55 1;0.45 0 0.55 1" } as const;
        return (
          <g key={i}>
            <line x1={x} x2={x} stroke="rgba(165,180,252,.18)" strokeWidth="1.2">
              <animate attributeName="y1" values={up} dur={`${dur}s`} begin={begin} repeatCount="indefinite" {...spline} />
              <animate attributeName="y2" values={down} dur={`${dur}s`} begin={begin} repeatCount="indefinite" {...spline} />
            </line>
            <circle cx={x} r="4" fill="#818CF8">
              <animate attributeName="cy" values={up} dur={`${dur}s`} begin={begin} repeatCount="indefinite" {...spline} />
              <animate attributeName="opacity" values="1;0.35;1" dur={`${dur}s`} begin={begin} repeatCount="indefinite" />
            </circle>
            <circle cx={x} r="4" fill="#A78BFA">
              <animate attributeName="cy" values={down} dur={`${dur}s`} begin={begin} repeatCount="indefinite" {...spline} />
              <animate attributeName="opacity" values="0.35;1;0.35" dur={`${dur}s`} begin={begin} repeatCount="indefinite" />
            </circle>
          </g>
        );
      })}
    </svg>
  );
}

function FinalCta() {
  return (
    <section className="mx-auto max-w-[1180px]" style={{ padding: "80px 40px 90px" }}>
      <Reveal>
        <div className="relative overflow-hidden text-center" style={{ border: "1px solid rgba(99,102,241,.25)", borderRadius: 24, background: "radial-gradient(120% 140% at 50% 0%,rgba(99,102,241,.16),rgba(139,92,246,.04) 45%,#0A0A0D 75%)", padding: "90px 40px" }}>
          <Helix />
          <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(60% 70% at 50% 50%,rgba(10,10,13,.85),transparent 80%)" }} />
          <h2 className="relative" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(38px, 5vw, 60px)", fontWeight: 500, letterSpacing: "-.015em", lineHeight: 1.04, margin: "0 0 34px", textWrap: "balance" } as React.CSSProperties}>
            Stop listing skills.<br />Start proving them.
          </h2>
          <div className="relative flex flex-wrap items-center justify-center gap-3">
            <Link href="/connect" className="flex items-center gap-2.5" style={{ fontSize: 15, fontWeight: 600, color: "#fff", background: "linear-gradient(140deg,#6366F1,#7C5CF6)", padding: "14px 24px", borderRadius: 12, boxShadow: "0 8px 28px rgba(99,102,241,.4)" }}>
              <GitHubIcon /> Create Your DNA
            </Link>
          </div>
        </div>
      </Reveal>
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
