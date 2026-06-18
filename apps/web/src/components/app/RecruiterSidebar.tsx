"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Briefcase, CreditCard, LogOut, Users } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/recruiter", label: "Find Talent", icon: Users },
  { href: "/recruiter/jobs", label: "Job Posts", icon: Briefcase },
  { href: "/recruiter/plans", label: "Plans", icon: CreditCard },
];

/** Sidebar for the recruiter app — a separate experience from the student app. */
export function RecruiterSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace("/recruiter/login");
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card/40 backdrop-blur md:flex">
      <div className="px-5 py-5">
        <Logo href="/recruiter" />
      </div>

      <nav className="flex-1 overflow-y-auto px-3">
        <p className="px-3 py-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          Recruiting
        </p>
        <div className="space-y-1">
          {NAV.map((item) => {
            const active =
              pathname === item.href || (item.href !== "/recruiter" && pathname.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary/10 text-foreground ring-1 ring-primary/20"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
            {(user?.name ?? user?.email ?? "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.name ?? "Recruiter"}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.companyName ?? user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
