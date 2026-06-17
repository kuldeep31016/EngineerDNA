"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@engineerdna/shared";
import { useAuthStore } from "@/store/auth";
import { LoadingScreen } from "@/components/LoadingScreen";

/**
 * Gates client pages behind authentication (and optionally a set of roles).
 * Unauthenticated users are sent to /login; wrong-role users to /unauthorized.
 */
export function ProtectedRoute({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: UserRole[];
}) {
  const router = useRouter();
  const { user, status } = useAuthStore();

  const roleAllowed = !roles || (user != null && roles.includes(user.role));

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    } else if (status === "authenticated" && !roleAllowed) {
      router.replace("/unauthorized");
    }
  }, [status, roleAllowed, router]);

  if (status !== "authenticated") {
    return <LoadingScreen label="Checking your session…" />;
  }
  if (!roleAllowed) {
    return <LoadingScreen label="Redirecting…" />;
  }
  return <>{children}</>;
}
