"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Briefcase, CreditCard, LogOut, MessagesSquare, Users } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";
import { useMessagesUnread } from "@/hooks/useMessagesUnread";
import { cn } from "@/lib/utils";
import { getSubscription } from "@/services/billing";

const FEATURE_NAV = [
  { href: "/recruiter", label: "Find Talent", icon: Users },
  { href: "/recruiter/jobs", label: "Job Posts", icon: Briefcase },
  { href: "/recruiter/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/messages", label: "Messages", icon: MessagesSquare },
];
const BILLING_NAV = { href: "/recruiter/plans", label: "Subscription & Billing", icon: CreditCard };

/**
 * Recruiter sidebar. Feature links (Find Talent, Job Posts) only appear with an
 * active subscription; otherwise just Subscription & Billing is shown — the
 * dashboard is locked until a plan is purchased.
 */
export function RecruiterSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [active, setActive] = useState<boolean | null>(null);
  const unread = useMessagesUnread();

  useEffect(() => {
    if (user?.role === "ADMIN") {
      setActive(true);
      return;
    }
    getSubscription()
      .then((s) => setActive(s.active))
      .catch(() => setActive(false));
  }, [user, pathname]);

  const nav = active ? [...FEATURE_NAV, BILLING_NAV] : [BILLING_NAV];

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card/40 backdrop-blur md:flex">
      <div className="px-5 py-5">
        <Logo href={active ? "/recruiter" : "/recruiter/plans"} />
      </div>

      <nav className="flex-1 overflow-y-auto px-3">
        <p className="px-3 py-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Recruiting</p>
        <div className="space-y-1">
          {nav.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== "/recruiter" && pathname.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-foreground ring-1 ring-primary/20"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.href === "/messages" && unread > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
        {active === false && (
          <p className="mt-3 px-3 text-xs text-muted-foreground">
            Purchase a plan to unlock the recruiter dashboard.
          </p>
        )}
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
