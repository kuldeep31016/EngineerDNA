"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  ExternalLink,
  GraduationCap,
  Library,
  Map,
  Sparkles,
  Target,
} from "lucide-react";
import type { DeveloperDna } from "@engineerdna/shared";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { getDna } from "@/services/dna";

type Resource = { title: string; by: string; type: "Docs" | "Course" | "Video" | "Book" | "Practice" | "Roadmap"; url: string };
type Category = { key: string; label: string; resources: Resource[] };

// Hand-curated, all FREE. Keyed to the Developer DNA dimensions so we can put a
// candidate's weakest areas first. Deterministic — no LLM, no API cost.
const CATALOG: Category[] = [
  {
    key: "backend",
    label: "Backend Engineering",
    resources: [
      { title: "Backend Developer Roadmap", by: "roadmap.sh", type: "Roadmap", url: "https://roadmap.sh/backend" },
      { title: "Node.js Official Docs & Guides", by: "Node.js", type: "Docs", url: "https://nodejs.org/en/learn" },
      { title: "The Twelve-Factor App", by: "Heroku", type: "Book", url: "https://12factor.net" },
      { title: "Spring Boot Guides", by: "Spring", type: "Docs", url: "https://spring.io/guides" },
    ],
  },
  {
    key: "frontend",
    label: "Frontend Engineering",
    resources: [
      { title: "Frontend Developer Roadmap", by: "roadmap.sh", type: "Roadmap", url: "https://roadmap.sh/frontend" },
      { title: "MDN Web Docs", by: "Mozilla", type: "Docs", url: "https://developer.mozilla.org" },
      { title: "React Official Docs", by: "Meta", type: "Docs", url: "https://react.dev/learn" },
      { title: "The Modern JavaScript Tutorial", by: "javascript.info", type: "Course", url: "https://javascript.info" },
    ],
  },
  {
    key: "systemdesign",
    label: "System Design",
    resources: [
      { title: "System Design Primer", by: "Donne Martin", type: "Book", url: "https://github.com/donnemartin/system-design-primer" },
      { title: "ByteByteGo", by: "Alex Xu", type: "Video", url: "https://www.youtube.com/@ByteByteGo" },
      { title: "Grokking System Design Concepts", by: "Educative (free articles)", type: "Course", url: "https://www.educative.io/blog/complete-guide-to-system-design" },
    ],
  },
  {
    key: "database",
    label: "Databases",
    resources: [
      { title: "PostgreSQL Tutorial", by: "postgresqltutorial.com", type: "Course", url: "https://www.postgresqltutorial.com" },
      { title: "Use The Index, Luke!", by: "Markus Winand", type: "Book", url: "https://use-the-index-luke.com" },
      { title: "MongoDB University", by: "MongoDB", type: "Course", url: "https://learn.mongodb.com" },
    ],
  },
  {
    key: "api",
    label: "API Design",
    resources: [
      { title: "REST API Tutorial", by: "restfulapi.net", type: "Docs", url: "https://restfulapi.net" },
      { title: "Learn GraphQL", by: "GraphQL.org", type: "Docs", url: "https://graphql.org/learn" },
      { title: "Google API Design Guide", by: "Google", type: "Book", url: "https://cloud.google.com/apis/design" },
    ],
  },
  {
    key: "cloud",
    label: "Cloud",
    resources: [
      { title: "AWS Skill Builder (free tier)", by: "AWS", type: "Course", url: "https://skillbuilder.aws" },
      { title: "Google Cloud Free Training", by: "Google", type: "Course", url: "https://cloud.google.com/training/free-labs" },
      { title: "Cloud roadmap", by: "roadmap.sh", type: "Roadmap", url: "https://roadmap.sh/aws" },
    ],
  },
  {
    key: "devops",
    label: "DevOps",
    resources: [
      { title: "Docker — Get Started", by: "Docker", type: "Docs", url: "https://docs.docker.com/get-started" },
      { title: "Kubernetes Basics", by: "Kubernetes", type: "Course", url: "https://kubernetes.io/docs/tutorials/kubernetes-basics" },
      { title: "DevOps Roadmap", by: "roadmap.sh", type: "Roadmap", url: "https://roadmap.sh/devops" },
    ],
  },
  {
    key: "aiml",
    label: "AI / ML",
    resources: [
      { title: "Practical Deep Learning", by: "fast.ai", type: "Course", url: "https://course.fast.ai" },
      { title: "Machine Learning Specialization (audit free)", by: "Andrew Ng", type: "Course", url: "https://www.coursera.org/specializations/machine-learning-introduction" },
      { title: "Hugging Face Course", by: "Hugging Face", type: "Course", url: "https://huggingface.co/learn" },
    ],
  },
  {
    key: "security",
    label: "Security",
    resources: [
      { title: "OWASP Top 10", by: "OWASP", type: "Docs", url: "https://owasp.org/www-project-top-ten" },
      { title: "Web Security Academy", by: "PortSwigger", type: "Practice", url: "https://portswigger.net/web-security" },
      { title: "Introduction to JWT", by: "jwt.io", type: "Docs", url: "https://jwt.io/introduction" },
    ],
  },
  {
    key: "testing",
    label: "Testing",
    resources: [
      { title: "Jest Documentation", by: "Meta", type: "Docs", url: "https://jestjs.io/docs/getting-started" },
      { title: "Testing JavaScript", by: "Kent C. Dodds", type: "Course", url: "https://testingjavascript.com" },
      { title: "Google Testing Blog", by: "Google", type: "Book", url: "https://testing.googleblog.com" },
    ],
  },
  {
    key: "foundations",
    label: "Foundations (DSA & Git)",
    resources: [
      { title: "NeetCode — DSA Patterns", by: "NeetCode", type: "Practice", url: "https://neetcode.io" },
      { title: "CS50: Intro to Computer Science", by: "Harvard", type: "Course", url: "https://cs50.harvard.edu/x" },
      { title: "Pro Git (free book)", by: "Scott Chacon", type: "Book", url: "https://git-scm.com/book" },
      { title: "Learn Git Branching", by: "learngitbranching.js.org", type: "Practice", url: "https://learngitbranching.js.org" },
    ],
  },
];

const TYPE_STYLE: Record<Resource["type"], string> = {
  Docs: "bg-sky-500/15 text-sky-300",
  Course: "bg-violet-500/15 text-violet-300",
  Video: "bg-rose-500/15 text-rose-300",
  Book: "bg-amber-500/15 text-amber-300",
  Practice: "bg-emerald-500/15 text-emerald-300",
  Roadmap: "bg-primary/15 text-primary",
};

function ResourcesContent() {
  const [dna, setDna] = useState<DeveloperDna | null>(null);

  useEffect(() => {
    getDna().then(setDna).catch(() => {});
  }, []);

  // Categories where the candidate is weakest (DNA value < 55), worst first.
  const weakKeys = (dna?.scores ?? [])
    .filter((s) => s.value < 55)
    .sort((a, b) => a.value - b.value)
    .map((s) => s.key);

  const recommended = weakKeys
    .map((k) => CATALOG.find((c) => c.key === k))
    .filter((c): c is Category => Boolean(c))
    .slice(0, 3);

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Library className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
          <p className="text-sm text-muted-foreground">Hand-picked, free resources to level up — focused on your gaps.</p>
        </div>
      </div>

      {/* Recommended for you — based on weak DNA dimensions */}
      {recommended.length > 0 && (
        <div className="mt-6 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Target className="h-4 w-4 text-primary" /> Recommended to level up
            <span className="text-xs font-normal text-muted-foreground">based on your Developer DNA</span>
          </div>
          <div className="space-y-4">
            {recommended.map((c) => (
              <div key={c.key}>
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Sparkles className="h-3 w-3 text-primary" /> Strengthen your {c.label}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {c.resources.slice(0, 2).map((r) => (
                    <ResourceRow key={r.url} r={r} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full library */}
      <div className="mt-6 space-y-5">
        {CATALOG.map((c) => (
          <div key={c.key} className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {c.key === "foundations" ? <GraduationCap className="h-4 w-4" /> : c.key === "systemdesign" ? <Map className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
              </span>
              <h3 className="text-sm font-semibold">{c.label}</h3>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {c.resources.map((r) => (
                <ResourceRow key={r.url} r={r} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Everything here is free. Build a project with what you learn — it becomes verified evidence on your profile.
      </p>
    </main>
  );
}

function ResourceRow({ r }: { r: Resource }) {
  return (
    <a
      href={r.url}
      target="_blank"
      rel="noreferrer"
      className="group flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 transition-colors hover:border-primary/40"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{r.title}</p>
        <p className="truncate text-xs text-muted-foreground">{r.by}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${TYPE_STYLE[r.type]}`}>{r.type}</span>
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-foreground" />
      </div>
    </a>
  );
}

export default function ResourcesPage() {
  return (
    <ProtectedRoute>
      <ResourcesContent />
    </ProtectedRoute>
  );
}
