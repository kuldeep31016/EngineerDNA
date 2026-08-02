"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, X } from "lucide-react";
import { APP_NAME, APP_TAGLINE } from "@engineerdna/shared";
import { useAuthStore } from "@/store/auth";
import { OAuthButton } from "@/components/auth/OAuthButton";
import { homeFor } from "@/lib/roles";

const ERROR_MESSAGES: Record<string, string> = {
  provider:
    "We couldn’t verify your sign-in. Please try again or choose a different provider.",
  account:
    "We couldn’t find an account matching that sign-in. Please try again or contact support.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, status } = useAuthStore();

  const error = searchParams.get("error");
  const errorMessage = ERROR_MESSAGES[error ?? ""] ?? null;

  // Already signed in? Skip the login screen (to the right home for the role).
  useEffect(() => {
    if (status === "authenticated") router.replace(homeFor(user?.role));
  }, [status, user, router]);

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
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">{APP_NAME}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{APP_TAGLINE}</p>
        </div>

        {errorMessage && (
          <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <OAuthButton provider="github" />
          <OAuthButton provider="google" />
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          We use your account only to sign you in. Repository access is requested
          later, and only with your permission.
        </p>
        <p className="mt-4 border-t border-border pt-4 text-center text-xs text-muted-foreground">
          Hiring engineers?{" "}
          <Link href="/recruiter/login" className="font-medium text-primary hover:underline">
            Recruiter sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
