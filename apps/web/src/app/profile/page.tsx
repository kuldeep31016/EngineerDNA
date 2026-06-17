"use client";

import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-none">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function ProfileContent() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-center gap-4">
        {user.profileImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.profileImage}
            alt={user.name ?? "avatar"}
            className="h-16 w-16 rounded-full border border-border"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-muted text-xl font-semibold">
            {(user.name ?? user.email).charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold">{user.name ?? "Unnamed developer"}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <Row label="Role" value={user.role} />
        <Row label="Signed in with" value={user.provider} />
        <Row label="Email verified" value={user.isVerified ? "Yes" : "No"} />
        <Row
          label="Last login"
          value={user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "—"}
        />
      </div>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
