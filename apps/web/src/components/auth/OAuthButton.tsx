import { Github } from "lucide-react";
import { oauthUrl } from "@/services/auth";
import { cn } from "@/lib/utils";

/** A button that starts an OAuth flow via full-page navigation to the API. */
export function OAuthButton({ provider }: { provider: "github" | "google" }) {
  const label = provider === "github" ? "Continue with GitHub" : "Continue with Google";
  return (
    <a
      href={oauthUrl(provider)}
      className={cn(
        "flex w-full items-center justify-center gap-3 rounded-lg border border-border px-4 py-3",
        "text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
      )}
    >
      {provider === "github" ? (
        <Github className="h-5 w-5" />
      ) : (
        <span className="text-base font-bold">G</span>
      )}
      {label}
    </a>
  );
}
