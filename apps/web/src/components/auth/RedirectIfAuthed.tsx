"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { LoadingScreen } from "@/components/LoadingScreen";
import { homeFor } from "@/lib/roles";

/**
 * Guards public/marketing pages: a signed-in user is bounced straight to their
 * app home (student dashboard / recruiter home) instead of seeing the page.
 * Unauthenticated (or still resolving) visitors render the children as-is.
 */
export function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, status } = useAuthStore();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(homeFor(user?.role));
    }
  }, [status, user, router]);

  if (status === "idle" || status === "loading") {
    return <LoadingScreen label="Checking your session…" />;
  }

  if (status === "authenticated") {
    return <LoadingScreen label="Redirecting…" />;
  }

  return <>{children}</>;
}
