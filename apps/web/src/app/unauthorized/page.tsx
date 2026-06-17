import Link from "next/link";

/** Shown when an authenticated user lacks the role for a resource. */
export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-bold">Access denied</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Your account doesn’t have permission to view this page.
      </p>
      <Link
        href="/dashboard"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        Back to dashboard
      </Link>
    </main>
  );
}
