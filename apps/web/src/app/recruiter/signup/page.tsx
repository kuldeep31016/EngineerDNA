"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Loader2, X } from "lucide-react";
import type { RecruiterSignupInput } from "@engineerdna/shared";
import { useAuthStore } from "@/store/auth";
import { recruiterSignup } from "@/services/auth";

export default function RecruiterSignupPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [form, setForm] = useState<RecruiterSignupInput>({
    companyName: "",
    name: "",
    email: "",
    password: "",
    title: "",
    companyWebsite: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (patch: Partial<RecruiterSignupInput>) => setForm((f) => ({ ...f, ...patch }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setUser(
        await recruiterSignup({
          companyName: form.companyName.trim(),
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          title: form.title?.trim() || undefined,
          companyWebsite: form.companyWebsite?.trim() || undefined,
        }),
      );
      router.replace("/recruiter");
    } catch (err) {
      setError(
        err instanceof Error && err.message.includes("409")
          ? "An account with this email already exists."
          : "Couldn't create your account. Check your details and try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-[80vh] items-center justify-center px-6 py-10">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <Link
          href="/"
          aria-label="Back to home"
          className="absolute right-4 top-4 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Link>

        <div className="mb-6 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-white">
            <Building2 className="h-5 w-5" />
          </span>
          <h1 className="mt-3 text-xl font-bold tracking-tight">Create a recruiter account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Search and hire verified engineers.</p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Company name" required>
              <input
                required
                value={form.companyName}
                onChange={(e) => set({ companyName: e.target.value })}
                placeholder="Acme Inc."
                className={inputCls}
              />
            </Field>
            <Field label="Your name" required>
              <input
                required
                value={form.name}
                onChange={(e) => set({ name: e.target.value })}
                placeholder="Jane Doe"
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Work email" required>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => set({ email: e.target.value })}
              placeholder="jane@acme.com"
              className={inputCls}
            />
          </Field>
          <Field label="Password" required>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => set({ password: e.target.value })}
              placeholder="At least 8 characters"
              className={inputCls}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Your title">
              <input
                value={form.title}
                onChange={(e) => set({ title: e.target.value })}
                placeholder="Tech Recruiter"
                className={inputCls}
              />
            </Field>
            <Field label="Company website">
              <input
                value={form.companyWebsite}
                onChange={(e) => set({ companyWebsite: e.target.value })}
                placeholder="acme.com"
                className={inputCls}
              />
            </Field>
          </div>

          {error && <p className="text-xs text-rose-300">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Create account
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/recruiter/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/60";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label} {required && <span className="text-rose-400">*</span>}
      </label>
      {children}
    </div>
  );
}
