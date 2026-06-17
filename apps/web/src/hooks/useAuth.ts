"use client";

import { useCallback } from "react";
import { useAuthStore } from "@/store/auth";
import { fetchMe, tryRefresh, logout as logoutRequest } from "@/services/auth";

/**
 * Auth facade for components: current user/status plus session actions.
 * `loadSession` attempts /auth/me and silently refreshes once on 401.
 */
export function useAuth() {
  const { user, status, setUser, setStatus, clear } = useAuthStore();

  const loadSession = useCallback(async () => {
    setStatus("loading");
    try {
      setUser(await fetchMe());
    } catch {
      // Access token may have expired — try a single refresh, then retry.
      const refreshed = await tryRefresh();
      if (refreshed) {
        try {
          setUser(await fetchMe());
          return;
        } catch {
          /* fall through to signed-out */
        }
      }
      clear();
    }
  }, [setUser, setStatus, clear]);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      clear();
    }
  }, [clear]);

  return {
    user,
    status,
    isAuthenticated: status === "authenticated",
    loadSession,
    logout,
  };
}
