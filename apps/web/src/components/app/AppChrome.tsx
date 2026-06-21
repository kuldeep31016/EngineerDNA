"use client";

import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { Sidebar } from "./Sidebar";
import { RecruiterSidebar } from "./RecruiterSidebar";
import { NotificationBell } from "./NotificationBell";

// Routes that render without the app sidebar (their own full-page chrome).
const BARE_ROUTES = new Set([
  "/",
  "/login",
  "/connect",
  "/unauthorized",
  "/recruiter/login",
  "/recruiter/signup",
]);

/**
 * Decides the page chrome: marketing/auth pages render bare; the signed-in app
 * gets a role-specific sidebar (recruiters and students have separate shells).
 */
export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);

  if (
    BARE_ROUTES.has(pathname) ||
    pathname.startsWith("/p/") ||
    pathname.startsWith("/u/") ||
    pathname.startsWith("/c/")
  )
    return <>{children}</>;

  // Until auth resolves (or right after logout), render WITHOUT a sidebar so we
  // never flash the wrong/student shell before a redirect to a login page.
  if (status !== "authenticated") {
    return <div className="min-h-screen">{children}</div>;
  }

  const isRecruiter = user?.role === "RECRUITER" || user?.role === "ADMIN";

  return (
    <div className="min-h-screen">
      {isRecruiter ? <RecruiterSidebar /> : <Sidebar />}
      {/* Floating notification bell, fixed to the top-right of the app. */}
      <div className="fixed right-5 top-4 z-40">
        <NotificationBell />
      </div>
      <div className="md:pl-64">{children}</div>
    </div>
  );
}
