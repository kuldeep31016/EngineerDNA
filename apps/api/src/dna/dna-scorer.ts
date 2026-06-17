import type { DeveloperEvidenceItem, Score, TechCategory } from "@engineerdna/shared";
import { canonicalTech } from "../verification/skill-matcher";

/**
 * Deterministic Developer DNA scoring (Module 8). NO LLM. Each dimension is
 * computed from the Module 6 evidence and carries a transparent explanation —
 * no score exists without the evidence behind it.
 */

interface Dimension {
  key: string;
  label: string;
  categories: TechCategory[];
  techs: string[]; // canonical keys
}

const DIMENSIONS: Dimension[] = [
  {
    key: "backend",
    label: "Backend Engineering",
    categories: [],
    techs: ["express", "nestjs", "fastify", "koa", "django", "flask", "fastapi", "springboot", "gin", "node", "java", "go", "ruby", "php"],
  },
  {
    key: "frontend",
    label: "Frontend Engineering",
    categories: [],
    techs: ["react", "vue", "svelte", "next", "angular", "tailwind", "typescript", "javascript", "css", "html"],
  },
  { key: "cloud", label: "Cloud Knowledge", categories: ["CLOUD"], techs: ["aws", "firebase", "googlecloud", "azure"] },
  {
    key: "devops",
    label: "DevOps Readiness",
    categories: ["DEPLOYMENT"],
    techs: ["docker", "githubactions", "kubernetes", "terraform", "vercel", "netlify", "heroku", "serverless"],
  },
  {
    key: "aiml",
    label: "AI / ML Experience",
    categories: [],
    techs: ["tensorflow", "tensorflowjs", "pytorch", "scikitlearn", "numpy", "pandas", "keras", "opencv"],
  },
  {
    key: "database",
    label: "Database Skills",
    categories: ["DATABASE"],
    techs: ["prisma", "typeorm", "sequelize", "sqlalchemy", "hibernate", "mongoose"],
  },
  {
    key: "api",
    label: "API Design Skills",
    categories: [],
    techs: ["graphql", "apollo", "express", "nestjs", "fastify", "fastapi", "springboot", "swagger"],
  },
  { key: "security", label: "Security Awareness", categories: ["AUTH"], techs: ["jwt", "passport", "bcrypt", "nextauth", "oauth", "helmet"] },
  { key: "testing", label: "Testing Practices", categories: ["TESTING"], techs: ["jest", "vitest", "mocha", "cypress", "playwright", "pytest", "junit", "mockito", "supertest", "automatedtests"] },
];

function levelFor(value: number): string {
  if (value <= 0) return "No evidence";
  if (value < 35) return "Emerging";
  if (value < 65) return "Proficient";
  if (value < 85) return "Strong";
  return "Expert";
}

function matches(dim: Dimension, item: DeveloperEvidenceItem): boolean {
  if (dim.categories.includes(item.category)) return true;
  return dim.techs.includes(canonicalTech(item.technology));
}

function scoreDimension(dim: Dimension, items: DeveloperEvidenceItem[]): Score {
  const matched = items.filter((i) => matches(dim, i));
  const used = matched.filter((i) => i.strength === "USED");
  const mentioned = matched.filter((i) => i.strength === "MENTIONED");
  const repos = new Set(used.flatMap((i) => i.repositories)).size;

  const raw = used.length * 20 + mentioned.length * 5 + Math.min((Math.max(repos, 1) - 1) * 4, 16);
  const value = Math.max(0, Math.min(100, raw));

  const usedNames = used.map((i) => i.technology);
  const mentionedNames = mentioned.map((i) => i.technology);

  let reasoning: string;
  if (used.length > 0) {
    reasoning = `Proven by ${usedNames.join(", ")}`;
    if (mentionedNames.length) reasoning += `; also mentions ${mentionedNames.join(", ")}`;
    reasoning += ` across ${repos} repositor${repos === 1 ? "y" : "ies"}.`;
  } else if (mentioned.length > 0) {
    reasoning = `Only mentioned (not confirmed in code): ${mentionedNames.join(", ")}.`;
  } else {
    reasoning = "No evidence collected for this area yet.";
  }

  return {
    key: dim.key,
    label: dim.label,
    value,
    level: levelFor(value),
    reasoning,
    evidenceRefs: [...usedNames, ...mentionedNames],
  };
}

/** System Design Maturity is a breadth score, not a single-technology score. */
function scoreSystemDesign(items: DeveloperEvidenceItem[]): Score {
  const used = items.filter((i) => i.strength === "USED");
  const usedCategories = new Set(used.map((i) => i.category));
  const techKeys = new Set(used.map((i) => canonicalTech(i.technology)));

  const hasBackend = [...techKeys].some((t) =>
    ["express", "nestjs", "django", "flask", "fastapi", "springboot", "node", "go"].includes(t),
  );
  const hasFrontend = [...techKeys].some((t) => ["react", "vue", "svelte", "next", "angular"].includes(t));
  const hasDatabase = usedCategories.has("DATABASE");
  const hasInfra = [...techKeys].some((t) => ["docker", "kubernetes", "terraform"].includes(t));

  const fullStack = hasBackend && hasFrontend && hasDatabase;
  const value = Math.max(
    0,
    Math.min(100, usedCategories.size * 10 + (fullStack ? 20 : 0) + (hasInfra ? 15 : 0)),
  );

  const signals: string[] = [];
  if (fullStack) signals.push("full-stack (backend + frontend + database)");
  if (hasInfra) signals.push("containerized / infrastructure-as-code");
  signals.push(`${usedCategories.size} technology categories used`);

  return {
    key: "systemdesign",
    label: "System Design Maturity",
    value,
    level: levelFor(value),
    reasoning:
      value > 0
        ? `Breadth of the work: ${signals.join(", ")}.`
        : "No evidence collected for this area yet.",
    evidenceRefs: [...usedCategories],
  };
}

export function computeDnaScores(items: DeveloperEvidenceItem[]): {
  scores: Score[];
  overall: number;
  topStrengths: string[];
} {
  const scores: Score[] = DIMENSIONS.map((dim) => scoreDimension(dim, items));
  // Insert System Design after API design for a logical reading order.
  scores.splice(7, 0, scoreSystemDesign(items));

  const overall = scores.length
    ? Math.round(scores.reduce((sum, s) => sum + s.value, 0) / scores.length)
    : 0;

  const topStrengths = [...scores]
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)
    .map((s) => s.label);

  return { scores, overall, topStrengths };
}
