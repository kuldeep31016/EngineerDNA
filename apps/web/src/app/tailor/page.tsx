"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Printer,
  Sparkles,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LoadingScreen } from "@/components/LoadingScreen";
import { extractJdFile, extractResumeFile } from "@/lib/resume";
import { downloadHtml, printToPdf } from "@/lib/export";
import { getSavedResume, saveResume, tailorResume } from "@/services/resume";
import type { TailorResumeResponse } from "@engineerdna/shared";

type ResumeChoice = "saved" | "new";

function TailorContent() {
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState<{ fileName: string | null; hasResume: boolean }>({
    fileName: null,
    hasResume: false,
  });
  const [choice, setChoice] = useState<ResumeChoice>("saved");
  const [resumeText, setResumeText] = useState("");
  const [resumeName, setResumeName] = useState<string | null>(null);
  const [parsingResume, setParsingResume] = useState(false);

  const [jdText, setJdText] = useState("");
  const [jdName, setJdName] = useState<string | null>(null);
  const [parsingJd, setParsingJd] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TailorResumeResponse | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getSavedResume()
      .then((r) => {
        setSaved({ fileName: r.fileName, hasResume: r.available });
        if (r.available) {
          setChoice("saved");
          setResumeText(r.resumeText ?? "");
        } else {
          setChoice("new");
        }
      })
      .catch(() => setChoice("new"))
      .finally(() => setLoaded(true));
  }, []);

  async function onResumeFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setResumeName(file.name);
    setParsingResume(true);
    try {
      setResumeText(await extractResumeFile(file));
    } catch {
      setError("Couldn't read that file — paste your resume text instead.");
      setResumeName(null);
      setResumeText("");
    } finally {
      setParsingResume(false);
    }
    e.target.value = "";
  }

  async function onJdFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setJdName(file.name);
    setParsingJd(true);
    try {
      setJdText(await extractJdFile(file));
    } catch {
      setError("Couldn't read that file — paste or type the job description instead.");
      setJdName(null);
      setJdText("");
    } finally {
      setParsingJd(false);
    }
    e.target.value = "";
  }

  function clearJd() {
    setJdText("");
    setJdName(null);
  }

  async function generate() {
    if (busy) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const text = resumeText.trim();
      // Persist a freshly chosen/uploaded resume as the new profile default,
      // so next time "Use my saved resume" offers it.
      if (choice === "new" && resumeName && text.length >= 30) {
        saveResume({ resumeText: text, fileName: resumeName }).catch(() => {
          /* non-fatal */
        });
      }
      const res = await tailorResume({ resumeText: text, jdText: jdText.trim() });
      setResult(res);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch {
      setError(
        "Couldn't tailor the resume. Make sure the analysis model is configured, then try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!loaded) return <LoadingScreen label="Loading your saved resume…" />;

  const resumeReady = resumeText.trim().length >= 30;
  const jdReady = jdText.trim().length >= 20;

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Wand2 className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tailor Resume</h1>
          <p className="text-sm text-muted-foreground">
            Rewrite your resume for a specific job description — your facts, optimized for the role.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="mt-6 space-y-6">
        {/* ---------------- Step 1: Resume source ---------------- */}
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">1. Choose your resume</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {saved.hasResume
              ? `You have a saved resume${saved.fileName ? ` (${saved.fileName})` : ""}. Use it, or pick a different one.`
              : "No saved resume yet — upload one to get started."}
          </p>

          <div className="mt-4 flex flex-col gap-2.5">
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${
                choice === "saved"
                  ? "border-primary/50 bg-primary/5"
                  : "border-border hover:bg-accent"
              } ${saved.hasResume ? "" : "opacity-40 pointer-events-none"}`}
            >
              <input
                type="radio"
                name="resume-source"
                checked={choice === "saved"}
                disabled={!saved.hasResume}
                onChange={() => setChoice("saved")}
                className="accent-primary"
              />
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="font-medium">Use my saved resume</span>
                {saved.fileName && (
                  <span className="ml-2 truncate text-xs text-muted-foreground">{saved.fileName}</span>
                )}
              </span>
            </label>

            <label
              className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${
                choice === "new" ? "border-primary/50 bg-primary/5" : "border-border hover:bg-accent"
              }`}
            >
              <input
                type="radio"
                name="resume-source"
                checked={choice === "new"}
                onChange={() => setChoice("new")}
                className="accent-primary"
              />
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Upload className="h-4 w-4" />
              </span>
              <span className="font-medium">Pick a different resume</span>
            </label>
          </div>

          {choice === "new" && (
            <div className="mt-4">
              {parsingResume ? (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" /> Reading your resume…
                </div>
              ) : resumeName ? (
                <div className="flex items-center gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm">
                  <FileText className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span className="min-w-0 flex-1 truncate">{resumeName}</span>
                  <button
                    onClick={() => {
                      setResumeName(null);
                      setResumeText("");
                    }}
                    aria-label="Remove resume"
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background px-3 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground">
                  <Upload className="h-4 w-4" /> Upload resume (PDF or DOCX)
                  <input
                    type="file"
                    accept="application/pdf,.pdf,.docx"
                    className="hidden"
                    onChange={onResumeFile}
                  />
                </label>
              )}
              {resumeName === null && (
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  rows={5}
                  placeholder="Or paste your resume text here."
                  className="mt-2 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/60"
                />
              )}
            </div>
          )}
        </section>

        {/* ---------------- Step 2: Job description ---------------- */}
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">2. Add the job description</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload the JD as a file, or paste / type it below.
          </p>

          <div className="mt-4">
            {parsingJd ? (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" /> Reading the job description…
              </div>
            ) : jdName ? (
              <div className="flex items-center gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm">
                <FileText className="h-4 w-4 shrink-0 text-emerald-400" />
                <span className="min-w-0 flex-1 truncate">{jdName}</span>
                <button
                  onClick={clearJd}
                  aria-label="Remove job description"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background px-3 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground">
                <Upload className="h-4 w-4" /> Upload job description (PDF, DOCX, or TXT)
                <input
                  type="file"
                  accept="application/pdf,.pdf,.docx,.txt,.md,text/plain"
                  className="hidden"
                  onChange={onJdFile}
                />
              </label>
            )}

            {jdName === null && (
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                rows={8}
                placeholder="Paste the job description here, or type the role, responsibilities, and required skills you're targeting."
                className="mt-2 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/60"
              />
            )}
          </div>
        </section>

        {/* ---------------- Generate ---------------- */}
        <button
          onClick={generate}
          disabled={!resumeReady || !jdReady || busy}
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Tailoring your resume…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Generate tailored resume
            </>
          )}
        </button>
      </div>

      {/* ---------------- Result ---------------- */}
      {result && (
        <div ref={resultRef} className="mt-8 scroll-mt-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Your tailored resume</h2>
              <p className="text-xs text-muted-foreground">
                Generated {new Date(result.generatedAt).toLocaleString()}. Your facts were kept — only
                the emphasis was tuned to the job.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => printToPdf(result.html)}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-3.5 py-2 text-sm font-medium transition-colors hover:bg-accent"
              >
                <Printer className="h-4 w-4" /> Print / Save as PDF
              </button>
              <button
                onClick={() => downloadHtml("tailored-resume", result.html)}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-3.5 py-2 text-sm font-medium transition-colors hover:bg-accent"
              >
                <Download className="h-4 w-4" /> Download HTML
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-white">
            <iframe title="Tailored resume" srcDoc={result.html} className="h-[900px] w-full" />
          </div>

          <div className="mt-4">
            <Link
              href="/resume"
              className="text-sm font-medium text-primary transition-opacity hover:opacity-80"
            >
              <ArrowLeft className="mr-1 inline h-4 w-4" /> Also want a full resume review?
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}

export default function TailorPage() {
  return (
    <ProtectedRoute>
      <TailorContent />
    </ProtectedRoute>
  );
}
