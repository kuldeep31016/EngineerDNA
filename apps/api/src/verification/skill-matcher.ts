/**
 * Normalizes technology / skill names so that "React.js", "ReactJS" and "React"
 * all match, and "Postgres" matches "PostgreSQL". Used to align a developer's
 * self-added skills with the evidence collected in Module 6.
 */

const ALIASES: Record<string, string> = {
  reactjs: "react",
  nodejs: "node",
  nextjs: "next",
  postgresql: "postgres",
  psql: "postgres",
  js: "javascript",
  ts: "typescript",
  tailwindcss: "tailwind",
  k8s: "kubernetes",
  mongo: "mongodb",
  expressjs: "express",
  vuejs: "vue",
  golang: "go",
  githubaction: "githubactions",
};

/** Canonical key for a technology or skill name. */
export function canonicalTech(name: string): string {
  const stripped = name
    .toLowerCase()
    .trim()
    .replace(/[\s._/-]+/g, "");
  return ALIASES[stripped] ?? stripped;
}
