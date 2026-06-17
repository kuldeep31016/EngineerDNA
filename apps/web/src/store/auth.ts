import { create } from "zustand";
import type { AuthUser } from "@engineerdna/shared";

export type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  /** The current user, or null when signed out. NEVER holds tokens. */
  user: AuthUser | null;
  status: AuthStatus;
  setUser: (user: AuthUser | null) => void;
  setStatus: (status: AuthStatus) => void;
  clear: () => void;
}

/**
 * Client auth state. Holds only the user object + status — the access/refresh
 * tokens live in HTTP-only cookies and are intentionally invisible to JS.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "idle",
  setUser: (user) =>
    set({ user, status: user ? "authenticated" : "unauthenticated" }),
  setStatus: (status) => set({ status }),
  clear: () => set({ user: null, status: "unauthenticated" }),
}));
