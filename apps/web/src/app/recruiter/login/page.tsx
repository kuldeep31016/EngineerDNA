"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Loader2, X } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { recruiterLogin } from "@/services/auth";

export default function RecruiterLoginPage() {
  const router = useRouter();
  const { user, status, setUser } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && user?.role === "RECRUITER") router.replace("/recruiter");
  }, [status, user, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setUser(await recruiterLogin({ email, password }));
      router.replace("/recruiter");
    } catch {
      setError("Invalid email or password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-[80vh] items-center justify-center px-6">
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
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
          <h1 className="mt-3 text-xl font-bold tracking-tight">Recruiter sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">Hire from verified engineering evidence.</p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Work email"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary/60"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary/60"
          />
          {error && <p className="text-xs text-rose-300">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Sign in
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link href="/recruiter/signup" className="font-medium text-primary hover:underline">
            Create a recruiter account
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Looking for the student app?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </main>
  );
}
