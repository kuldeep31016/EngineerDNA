"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { X } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { oauthUrl } from "@/services/auth";

const C = {
  bg: "#09090B",
  panel: "#141417",
  line: "rgba(255,255,255,.08)",
  line2: "rgba(255,255,255,.05)",
  tx: "#FAFAFA",
  tx2: "#A1A1AA",
  tx3: "#8E8E99",
};

const GitHubIcon = ({ size = 18, fill = "#fff" }: { size?: number; fill?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} aria-hidden>
    <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49v-1.7c-2.78.62-3.37-1.22-3.37-1.22-.46-1.18-1.11-1.49-1.11-1.49-.91-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.57 2.34 1.12 2.91.85.09-.66.35-1.12.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05a9.3 9.3 0 0 1 5 0c1.91-1.32 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.35 4.8-4.58 5.05.36.32.68.94.68 1.9v2.82c0 .27.18.6.69.49A10.02 10.02 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
  </svg>
);

const Check = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M5 12l4 4 10-10" stroke="#6EE7B7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function ConnectPage() {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [status, router]);

  return (
    <div className="relative grid min-h-screen lg:grid-cols-[1.05fr_.95fr]" style={{ background: C.bg, color: C.tx }}>
      <Link
        href="/"
        aria-label="Back to home"
        className="absolute right-5 top-5 z-10 rounded-md p-2 transition-colors hover:bg-white/5"
        style={{ color: C.tx2 }}
      >
        <X className="h-5 w-5" />
      </Link>
      {/* Left brand panel */}
      <div
        className="relative hidden flex-col justify-between overflow-hidden lg:flex"
        style={{
          padding: "40px 56px",
          background:
            "radial-gradient(120% 100% at 0% 0%,rgba(99,102,241,.16),transparent 55%),linear-gradient(180deg,#0C0C10,#09090B)",
          borderRight: `1px solid ${C.line2}`,
        }}
      >
        <Link href="/" className="relative z-[2] flex items-center gap-2.5">
          <span className="flex items-center justify-center" style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(140deg,#6366F1,#8B5CF6)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M7 4c0 6 10 10 10 16M17 4c0 6-10 10-10 16" stroke="#fff" strokeWidth="2" strokeLinecap="round" /></svg>
          </span>
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-.02em" }}>EngineerDNA</span>
        </Link>

        <div className="relative z-[2]" style={{ maxWidth: 420 }}>
          <h2 style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-.03em", lineHeight: 1.12, margin: "0 0 18px" }}>
            Your code is your
            <br />
            real resume.
          </h2>
          <p style={{ fontSize: 15.5, lineHeight: 1.6, color: C.tx2, margin: "0 0 34px" }}>
            In under a minute, EngineerDNA reads your repositories and builds a verified engineering profile — no forms,
            no self-reporting.
          </p>
          <div className="flex flex-col gap-4">
            {["Read-only access — we never write to your code", "Revoke access at any time, instantly", "Private repo contents stay private"].map((t) => (
              <div key={t} className="flex items-center gap-3">
                <span className="flex items-center justify-center" style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(52,211,153,.12)" }}>
                  <Check />
                </span>
                <span style={{ fontSize: 14, color: C.tx }}>{t}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-[2] flex items-center gap-3">
          <div className="flex">
            {["linear-gradient(140deg,#6366F1,#8B5CF6)", "linear-gradient(140deg,#34D399,#10B981)", "linear-gradient(140deg,#FB923C,#F97316)"].map((g, i) => (
              <span key={i} style={{ width: 30, height: 30, borderRadius: 999, background: g, border: "2px solid #0A0A0D", marginLeft: i === 0 ? 0 : -10 }} />
            ))}
          </div>
          <span style={{ fontSize: 13, color: C.tx3 }}>
            Joined by <span style={{ color: C.tx2 }}>42,000+</span> engineers
          </span>
        </div>
      </div>

      {/* Right — GitHub only */}
      <div className="flex items-center justify-center p-10">
        <div className="w-full" style={{ maxWidth: 420 }}>
          <div className="mx-auto mb-[22px] flex items-center justify-center" style={{ width: 60, height: 60, borderRadius: 16, background: "#18181B", border: `1px solid ${C.line}` }}>
            <GitHubIcon size={30} />
          </div>
          <h1 className="text-center" style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-.02em", margin: "0 0 8px" }}>
            Connect your GitHub
          </h1>
          <p className="text-center" style={{ fontSize: 14.5, color: C.tx2, margin: "0 0 28px" }}>
            Authorize EngineerDNA to analyze your public and private repositories.
          </p>

          <div style={{ border: `1px solid ${C.line}`, borderRadius: 13, background: C.panel, padding: "16px 18px", marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: C.tx3, letterSpacing: ".04em", marginBottom: 12 }}>ENGINEERDNA WILL ACCESS</div>
            <div className="flex flex-col gap-3">
              {[
                "Repository metadata & structure",
                "Commit history & contribution graph",
                "Languages, frameworks & dependencies",
              ].map((t) => (
                <div key={t} className="flex items-center gap-2.5" style={{ fontSize: 13.5, color: C.tx2 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="3" stroke="#6E6E78" strokeWidth="1.6" /><path d="M8 12h8" stroke="#6E6E78" strokeWidth="1.6" strokeLinecap="round" /></svg>
                  {t}
                </div>
              ))}
            </div>
          </div>

          <a
            href={oauthUrl("github")}
            className="flex w-full items-center justify-center gap-2.5 transition-opacity hover:opacity-90"
            style={{ fontSize: 15, fontWeight: 600, color: "#09090B", background: "#fff", padding: 14, borderRadius: 12, marginBottom: 18 }}
          >
            <GitHubIcon size={18} fill="#09090B" /> Authorize with GitHub
          </a>

          <div className="flex items-center justify-center gap-2">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="9" rx="2" stroke="#6E6E78" strokeWidth="1.6" /><path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="#6E6E78" strokeWidth="1.6" /></svg>
            <span style={{ fontSize: 12, color: C.tx3 }}>Secured with OAuth · Read-only access</span>
          </div>

          <p className="mt-6 text-center" style={{ fontSize: 12.5, color: C.tx3 }}>
            Prefer email?{" "}
            <Link href="/login" style={{ color: "#A5B4FC" }}>
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
