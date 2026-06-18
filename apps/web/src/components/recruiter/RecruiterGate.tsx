"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useAuthStore } from "@/store/auth";
import { getSubscription } from "@/services/billing";

/**
 * Gates recruiter FEATURE pages: requires the RECRUITER role AND an active
 * subscription. Recruiters without an active plan are routed to /recruiter/plans.
 * Admins bypass the subscription check. (The backend enforces this too.)
 */
function GateInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (user?.role === "ADMIN") {
      setReady(true);
      return;
    }
    getSubscription()
      .then((s) => {
        if (s.active) setReady(true);
        else router.replace("/recruiter/plans");
      })
      .catch(() => router.replace("/recruiter/plans"));
  }, [user, router]);

  if (!ready) return <LoadingScreen label="Checking your subscription…" />;
  return <>{children}</>;
}

export function RecruiterGate({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute roles={["RECRUITER", "ADMIN"]}>
      <GateInner>{children}</GateInner>
    </ProtectedRoute>
  );
}
