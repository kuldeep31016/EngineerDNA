"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { APP_NAME, APP_TAGLINE } from "@engineerdna/shared";
import { useAuthStore } from "@/store/auth";
import { OAuthButton } from "@/components/auth/OAuthButton";

export default function LoginPage() {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);

  // Already signed in? Skip the login screen.
  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [status, router]);

  return (
    <main className="flex min-h-[80vh] items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">{APP_NAME}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{APP_TAGLINE}</p>
        </div>

        <div className="flex flex-col gap-3">
          <OAuthButton provider="github" />
          <OAuthButton provider="google" />
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          We use your account only to sign you in. Repository access is requested
          later, and only with your permission.
        </p>
      </div>
    </main>
  );
}
