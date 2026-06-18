"use client";

import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { Sidebar } from "./Sidebar";
import { RecruiterSidebar } from "./RecruiterSidebar";

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

  if (BARE_ROUTES.has(pathname) || pathname.startsWith("/p/")) return <>{children}</>;

  const isRecruiter = user?.role === "RECRUITER" || user?.role === "ADMIN";

  return (
    <div className="min-h-screen">
      {isRecruiter ? <RecruiterSidebar /> : <Sidebar />}
      <div className="md:pl-64">{children}</div>
    </div>
  );
}
