"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

/**
 * Loads the session once on app mount so the whole tree knows who is signed in.
 * Renders children immediately; pages that require auth use <ProtectedRoute>.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { loadSession } = useAuth();

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  return <>{children}</>;
}
