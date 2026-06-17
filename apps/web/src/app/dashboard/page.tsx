"use client";

import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

/** Placeholder dashboard — future modules fill these panels with real data. */
function DashboardContent() {
  const { user } = useAuth();

  const panels = [
    { title: "Developer DNA", note: "Coming in a later module" },
    { title: "Verified Skills", note: "Backed by repository evidence" },
    { title: "Engineering Score", note: "Auditable, evidence-based" },
    { title: "Career Intelligence", note: "Personalized to your DNA" },
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">
        Welcome{user?.name ? `, ${user.name}` : ""}.
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Your engineering identity will be built here, from evidence.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {panels.map((panel) => (
          <div
            key={panel.title}
            className="rounded-xl border border-border bg-card p-5"
          >
            <h2 className="font-semibold">{panel.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{panel.note}</p>
          </div>
        ))}
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
