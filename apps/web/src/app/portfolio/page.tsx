"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Eye, Globe, Loader2, Plus, Save, Trash2, Upload, X } from "lucide-react";
import { PORTFOLIO_THEMES, type PortfolioData, type PortfolioTheme } from "@engineerdna/shared";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LoadingScreen } from "@/components/LoadingScreen";
import { extractResumeFile } from "@/lib/resume";
import { extractPortfolio, getPortfolio, updatePortfolio } from "@/services/portfolio";
import { renderPortfolioHtml } from "@/components/portfolio/render";

const SWATCH: Record<PortfolioTheme, string> = {
  modern: "linear-gradient(135deg,#9A6B3C,#7A5228)",
  minimal: "linear-gradient(135deg,#C9A84C,#fff)",
  dark: "linear-gradient(135deg,#0FBFAD,#0A0A0A)",
  creative: "linear-gradient(135deg,#B84A2A,#FB7185)",
  corporate: "linear-gradient(135deg,#10B981,#1D4ED8)",
};

const input =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/60";

function PortfolioContent() {
  const [loaded, setLoaded] = useState(false);
  const [available, setAvailable] = useState(false);
  const [data, setData] = useState<PortfolioData | null>(null);
  const [theme, setTheme] = useState<PortfolioTheme>("modern");
  const [published, setPublished] = useState(false);
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState<null | "extract" | "save">(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    getPortfolio()
      .then((p) => {
        setAvailable(p.available);
        setData(p.data);
        setTheme(p.theme);
        setPublished(p.published);
        setSlug(p.slug ?? "");
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  async function onUpload(file: File) {
    setBusy("extract");
    setError(null);
    try {
      const text = await extractResumeFile(file);
      if (text.trim().length < 30) throw new Error("Couldn't read enough text from that file.");
      const p = await extractPortfolio({ resumeText: text });
      setAvailable(true);
      setData(p.data);
      setTheme(p.theme);
      setPublished(p.published);
      setSlug(p.slug ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't process that resume.");
    } finally {
      setBusy(null);
    }
  }

  async function save() {
    if (!data) return;
    setBusy("save");
    setError(null);
    try {
      const p = await updatePortfolio({ data, theme, published, slug: slug || undefined });
      setSlug(p.slug ?? "");
    } catch (e) {
      setError(
        e instanceof Error && e.message.includes("409") ? "That portfolio URL is taken." : "Couldn't save changes.",
      );
    } finally {
      setBusy(null);
    }
  }

  const previewHtml = useMemo(() => (data ? renderPortfolioHtml(theme, data) : ""), [theme, data]);

  if (!loaded) return <LoadingScreen label="Loading your portfolio…" />;

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Globe className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
          <p className="text-sm text-muted-foreground">Upload your resume — get a shareable portfolio site.</p>
        </div>
        {available && (
          <button
            onClick={() => setPreview((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Eye className="h-3.5 w-3.5" /> {preview ? "Hide" : "Preview"}
          </button>
        )}
      </div>

      {error && (
        <p className="mt-5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</p>
      )}

      {!available || !data ? (
        <Uploader busy={busy === "extract"} onUpload={onUpload} />
      ) : preview ? (
        <div className="mt-5 overflow-hidden rounded-xl border border-border">
          <iframe title="Preview" srcDoc={previewHtml} className="h-[78vh] w-full border-0" sandbox="allow-scripts allow-same-origin" />
        </div>
      ) : (
        <Editor
          data={data}
          setData={setData}
          theme={theme}
          setTheme={setTheme}
          published={published}
          setPublished={setPublished}
          slug={slug}
          setSlug={setSlug}
          saving={busy === "save"}
          onSave={save}
        />
      )}
    </main>
  );
}

/* ---------------- Uploader ---------------- */

function Uploader({ busy, onUpload }: { busy: boolean; onUpload: (f: File) => void }) {
  return (
    <div className="mt-6 rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-card p-8 text-center">
      <h2 className="text-lg font-semibold">Generate from your resume</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        Upload a PDF or DOCX. We read it in your browser and use one quick AI pass to structure it — then you edit
        everything. Pick a theme and publish.
      </p>
      <label className="mx-auto mt-6 flex max-w-sm cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-background px-6 py-10 transition-colors hover:border-primary/50">
        {busy ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Reading &amp; structuring…</span>
          </>
        ) : (
          <>
            <Upload className="h-6 w-6 text-primary" />
            <span className="text-sm font-medium">Upload PDF or DOCX</span>
            <span className="text-xs text-muted-foreground">Your file stays in your browser</span>
          </>
        )}
        <input
          type="file"
          accept="application/pdf,.pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(f);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}

/* ---------------- Editor ---------------- */

function Editor({
  data,
  setData,
  theme,
  setTheme,
  published,
  setPublished,
  slug,
  setSlug,
  saving,
  onSave,
}: {
  data: PortfolioData;
  setData: (d: PortfolioData) => void;
  theme: PortfolioTheme;
  setTheme: (t: PortfolioTheme) => void;
  published: boolean;
  setPublished: (b: boolean) => void;
  slug: string;
  setSlug: (s: string) => void;
  saving: boolean;
  onSave: () => void;
}) {
  const patch = (p: Partial<PortfolioData>) => setData({ ...data, ...p });
  const publicUrl = typeof window !== "undefined" && slug ? `${window.location.origin}/p/${slug}` : "";
  const [copied, setCopied] = useState(false);

  return (
    <div className="mt-6 space-y-4">
      {/* Publish + theme bar */}
      <div className="rounded-xl border border-border bg-card p-5">
        <Card title="Theme">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {PORTFOLIO_THEMES.map((t) => (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={`rounded-lg border p-2 text-left transition-colors ${theme === t.value ? "border-primary ring-1 ring-primary/30" : "border-border hover:border-primary/40"}`}
              >
                <span className="block h-10 w-full rounded-md" style={{ background: SWATCH[t.value] }} />
                <span className="mt-1.5 block text-xs font-medium">{t.label}</span>
              </button>
            ))}
          </div>
        </Card>

        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="h-4 w-4" />
            Publish
          </label>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>/p/</span>
            <input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} placeholder="your-name" className={`${input} w-40`} />
          </div>
          {published && publicUrl && (
            <a href={publicUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              View live <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {published && publicUrl && (
            <button
              onClick={() => {
                void navigator.clipboard.writeText(publicUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {copied ? "Copied!" : "Copy link"}
            </button>
          )}
          <button
            onClick={onSave}
            disabled={saving}
            className="ml-auto inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
          </button>
        </div>
      </div>

      {/* Personal */}
      <Card title="Basics">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name"><input className={input} value={data.personal.name} onChange={(e) => patch({ personal: { ...data.personal, name: e.target.value } })} /></Field>
          <Field label="Title"><input className={input} value={data.personal.title} onChange={(e) => patch({ personal: { ...data.personal, title: e.target.value } })} /></Field>
          <Field label="Email"><input className={input} value={data.personal.email} onChange={(e) => patch({ personal: { ...data.personal, email: e.target.value } })} /></Field>
          <Field label="Location"><input className={input} value={data.personal.location} onChange={(e) => patch({ personal: { ...data.personal, location: e.target.value } })} /></Field>
          <Field label="GitHub"><input className={input} value={data.personal.github} onChange={(e) => patch({ personal: { ...data.personal, github: e.target.value } })} /></Field>
          <Field label="LinkedIn"><input className={input} value={data.personal.linkedin} onChange={(e) => patch({ personal: { ...data.personal, linkedin: e.target.value } })} /></Field>
        </div>
        <Field label="Summary" className="mt-3">
          <textarea rows={4} className={`${input} resize-y`} value={data.summary} onChange={(e) => patch({ summary: e.target.value })} />
        </Field>
      </Card>

      {/* Skills */}
      <Card title="Skills">
        <div className="space-y-3">
          {(["languages", "frameworks", "databases", "tools", "cloud"] as const).map((k) => (
            <Field key={k} label={k}>
              <Chips value={data.skills[k]} onChange={(v) => patch({ skills: { ...data.skills, [k]: v } })} />
            </Field>
          ))}
        </div>
      </Card>

      {/* Projects */}
      <ListCard
        title="Projects"
        items={data.projects}
        blank={{ title: "", description: "", techStack: [], github: "", live: "", image: "", highlights: [], duration: "" }}
        onChange={(v) => patch({ projects: v })}
        render={(p, up) => (
          <>
            <div className="grid gap-2 sm:grid-cols-2">
              <input className={input} placeholder="Title" value={p.title} onChange={(e) => up({ title: e.target.value })} />
              <input className={input} placeholder="Duration (e.g. 2024)" value={p.duration} onChange={(e) => up({ duration: e.target.value })} />
            </div>
            <textarea className={`${input} mt-2 resize-y`} rows={2} placeholder="Description" value={p.description} onChange={(e) => up({ description: e.target.value })} />
            <div className="mt-2"><Chips value={p.techStack} onChange={(v) => up({ techStack: v })} placeholder="Tech stack…" /></div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <input className={input} placeholder="GitHub URL" value={p.github} onChange={(e) => up({ github: e.target.value })} />
              <input className={input} placeholder="Live URL" value={p.live} onChange={(e) => up({ live: e.target.value })} />
            </div>
            <Lines className="mt-2" placeholder="Highlights (one per line)" value={p.highlights} onChange={(v) => up({ highlights: v })} />
          </>
        )}
      />

      {/* Experience */}
      <ListCard
        title="Experience"
        items={data.experience}
        blank={{ company: "", role: "", start: "", end: "", location: "", highlights: [] }}
        onChange={(v) => patch({ experience: v })}
        render={(e, up) => (
          <>
            <div className="grid gap-2 sm:grid-cols-2">
              <input className={input} placeholder="Role" value={e.role} onChange={(ev) => up({ role: ev.target.value })} />
              <input className={input} placeholder="Company" value={e.company} onChange={(ev) => up({ company: ev.target.value })} />
              <input className={input} placeholder="Start" value={e.start} onChange={(ev) => up({ start: ev.target.value })} />
              <input className={input} placeholder="End" value={e.end} onChange={(ev) => up({ end: ev.target.value })} />
              <input className={input} placeholder="Location" value={e.location} onChange={(ev) => up({ location: ev.target.value })} />
            </div>
            <Lines className="mt-2" placeholder="Highlights (one per line)" value={e.highlights} onChange={(v) => up({ highlights: v })} />
          </>
        )}
      />

      {/* Education */}
      <ListCard
        title="Education"
        items={data.education}
        blank={{ school: "", degree: "", field: "", start: "", end: "", details: "" }}
        onChange={(v) => patch({ education: v })}
        render={(e, up) => (
          <div className="grid gap-2 sm:grid-cols-2">
            <input className={input} placeholder="School" value={e.school} onChange={(ev) => up({ school: ev.target.value })} />
            <input className={input} placeholder="Degree" value={e.degree} onChange={(ev) => up({ degree: ev.target.value })} />
            <input className={input} placeholder="Field" value={e.field} onChange={(ev) => up({ field: ev.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <input className={input} placeholder="Start" value={e.start} onChange={(ev) => up({ start: ev.target.value })} />
              <input className={input} placeholder="End" value={e.end} onChange={(ev) => up({ end: ev.target.value })} />
            </div>
          </div>
        )}
      />

      {/* Certifications */}
      <ListCard
        title="Certifications"
        items={data.certifications}
        blank={{ name: "", issuer: "", date: "", url: "" }}
        onChange={(v) => patch({ certifications: v })}
        render={(c, up) => (
          <div className="grid gap-2 sm:grid-cols-3">
            <input className={input} placeholder="Name" value={c.name} onChange={(e) => up({ name: e.target.value })} />
            <input className={input} placeholder="Issuer" value={c.issuer} onChange={(e) => up({ issuer: e.target.value })} />
            <input className={input} placeholder="Date" value={c.date} onChange={(e) => up({ date: e.target.value })} />
          </div>
        )}
      />

      {/* Achievements */}
      <Card title="Achievements">
        <Lines placeholder="One achievement per line" value={data.achievements} onChange={(v) => patch({ achievements: v })} />
      </Card>

      <div className="flex justify-end">
        <button onClick={onSave} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save changes
        </button>
      </div>
    </div>
  );
}

/* ---------------- small reusable bits ---------------- */

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function Chips({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [text, setText] = useState("");
  const add = (s: string) => {
    const v = s.trim();
    if (v && !value.some((x) => x.toLowerCase() === v.toLowerCase())) onChange([...value, v]);
    setText("");
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-2">
      {value.map((v) => (
        <span key={v} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          {v}
          <button onClick={() => onChange(value.filter((x) => x !== v))} aria-label={`Remove ${v}`}><X className="h-3 w-3" /></button>
        </span>
      ))}
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add(text);
          }
        }}
        placeholder={placeholder ?? "Add…"}
        className="min-w-[6rem] flex-1 bg-transparent text-sm outline-none"
      />
    </div>
  );
}

function Lines({ value, onChange, placeholder, className }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string; className?: string }) {
  return (
    <textarea
      className={`${input} resize-y ${className ?? ""}`}
      rows={Math.max(2, value.length + 1)}
      placeholder={placeholder}
      value={value.join("\n")}
      onChange={(e) => onChange(e.target.value.split("\n").map((l) => l.trim()).filter(Boolean))}
    />
  );
}

function ListCard<T>({
  title,
  items,
  blank,
  onChange,
  render,
}: {
  title: string;
  items: T[];
  blank: T;
  onChange: (v: T[]) => void;
  render: (item: T, update: (patch: Partial<T>) => void) => React.ReactNode;
}) {
  return (
    <Card title={title}>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="rounded-lg border border-border bg-background/40 p-3">
            <div className="mb-2 flex justify-end">
              <button onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Remove" className="text-muted-foreground hover:text-rose-300">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            {render(item, (patch) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it))))}
          </div>
        ))}
        <button
          onClick={() => onChange([...items, { ...blank }])}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>
    </Card>
  );
}

export default function PortfolioPage() {
  return (
    <ProtectedRoute>
      <PortfolioContent />
    </ProtectedRoute>
  );
}
