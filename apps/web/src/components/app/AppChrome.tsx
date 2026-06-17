"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";

// Routes that render without the app sidebar (their own full-page chrome).
const BARE_ROUTES = new Set(["/", "/login", "/connect", "/unauthorized"]);

/**
 * Decides the page chrome: marketing/auth pages render bare; everything else
 * (the signed-in app) gets the left sidebar.
 */
export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (BARE_ROUTES.has(pathname)) return <>{children}</>;

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="md:pl-64">{children}</div>
    </div>
  );
}
