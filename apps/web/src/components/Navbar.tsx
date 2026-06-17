"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { APP_NAME } from "@engineerdna/shared";
import { useAuth } from "@/hooks/useAuth";

/** Top navigation. Reflects auth state from the store (user, never tokens). */
export function Navbar() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="font-semibold tracking-tight">
          {APP_NAME}
        </Link>

        <div className="flex items-center gap-4 text-sm">
          {isAuthenticated ? (
            <>
              <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
                Dashboard
              </Link>
              <Link href="/repositories" className="text-muted-foreground hover:text-foreground">
                Repositories
              </Link>
              <Link href="/evidence" className="text-muted-foreground hover:text-foreground">
                Evidence
              </Link>
              <Link href="/profile" className="text-muted-foreground hover:text-foreground">
                {user?.name ?? "Profile"}
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-md border border-border px-3 py-1.5 hover:bg-accent"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground hover:opacity-90"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
