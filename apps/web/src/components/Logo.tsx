import Link from "next/link";
import { APP_NAME } from "@engineerdna/shared";
import { cn } from "@/lib/utils";

/** The EngineerDNA brand mark — a DNA strand in an indigo→violet gradient tile. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex items-center justify-center rounded-lg bg-brand shadow-[0_0_20px_rgba(99,102,241,0.45)]",
        className,
      )}
    >
      <svg width="60%" height="60%" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M7 4c0 6 10 10 10 16M17 4c0 6-10 10-10 16"
          stroke="#fff"
          strokeWidth={2}
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

/** Full logo (mark + wordmark), links home. */
export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className="h-7 w-7" />
      <span className="text-[17px] font-bold tracking-tight">{APP_NAME}</span>
    </Link>
  );
}
