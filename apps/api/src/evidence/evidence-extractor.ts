import type { Proof, RepoEvidenceItem, TechCategory } from "@engineerdna/shared";

/**
 * The Evidence Engine's deterministic core (Module 6). NO LLM.
 *
 * Given a repository's facts, it produces evidence for each technology and
 * decides whether it is USED (proven by real implementation — config files,
 * hallmark structure, detected languages) or only MENTIONED (a declared
 * dependency we couldn't confirm is wired in). This is the "dependency-added
 * vs real implementation" distinction at the heart of the product.
 */

export interface EvidenceInput {
  primaryLanguages: string[];
  filePaths: string[];
  manifests: { path: string; content: string }[];
}

const USED = "USED" as const;

interface Acc {
  technology: string;
  category: TechCategory;
  strength: "USED" | "MENTIONED";
  confidence: number;
  proofs: Proof[];
}

/** Known npm packages → normalized technology + category. */
const NPM_MAP: Record<string, [string, TechCategory]> = {
  react: ["React", "FRAMEWORK"],
  vue: ["Vue", "FRAMEWORK"],
  svelte: ["Svelte", "FRAMEWORK"],
  next: ["Next.js", "FRAMEWORK"],
  express: ["Express", "FRAMEWORK"],
  fastify: ["Fastify", "FRAMEWORK"],
  koa: ["Koa", "FRAMEWORK"],
  prisma: ["Prisma", "TOOL"],
  "@prisma/client": ["Prisma", "TOOL"],
  pg: ["PostgreSQL", "DATABASE"],
  mysql: ["MySQL", "DATABASE"],
  mysql2: ["MySQL", "DATABASE"],
  mongoose: ["MongoDB", "DATABASE"],
  mongodb: ["MongoDB", "DATABASE"],
  redis: ["Redis", "DATABASE"],
  ioredis: ["Redis", "DATABASE"],
  sqlite3: ["SQLite", "DATABASE"],
  "better-sqlite3": ["SQLite", "DATABASE"],
  sequelize: ["Sequelize", "TOOL"],
  typeorm: ["TypeORM", "TOOL"],
  jsonwebtoken: ["JWT", "AUTH"],
  passport: ["Passport", "AUTH"],
  bcrypt: ["bcrypt", "AUTH"],
  bcryptjs: ["bcrypt", "AUTH"],
  "next-auth": ["NextAuth", "AUTH"],
  "aws-sdk": ["AWS", "CLOUD"],
  firebase: ["Firebase", "CLOUD"],
  "firebase-admin": ["Firebase", "CLOUD"],
  stripe: ["Stripe", "LIBRARY"],
  axios: ["Axios", "LIBRARY"],
  graphql: ["GraphQL", "LIBRARY"],
  "socket.io": ["Socket.IO", "LIBRARY"],
  tailwindcss: ["Tailwind CSS", "FRAMEWORK"],
  jest: ["Jest", "TESTING"],
  vitest: ["Vitest", "TESTING"],
  mocha: ["Mocha", "TESTING"],
  cypress: ["Cypress", "TESTING"],
  supertest: ["Supertest", "TESTING"],
  typescript: ["TypeScript", "LANGUAGE"],
  zod: ["Zod", "LIBRARY"],
  redux: ["Redux", "LIBRARY"],
  zustand: ["Zustand", "LIBRARY"],
  vite: ["Vite", "TOOL"],
  webpack: ["Webpack", "TOOL"],
};

/** Scoped-package prefixes → normalized technology. */
const NPM_SCOPED: [string, string, TechCategory][] = [
  ["@aws-sdk/", "AWS", "CLOUD"],
  ["@nestjs/", "NestJS", "FRAMEWORK"],
  ["@angular/", "Angular", "FRAMEWORK"],
  ["@google-cloud/", "Google Cloud", "CLOUD"],
  ["@tensorflow", "TensorFlow.js", "LIBRARY"],
  ["@reduxjs/", "Redux", "LIBRARY"],
  ["@apollo/", "Apollo", "FRAMEWORK"],
  ["@playwright/", "Playwright", "TESTING"],
  ["@tanstack/react-query", "React Query", "LIBRARY"],
];

/** Known identifiers in Python/Java/Go manifests → technology (MENTIONED). */
const TEXT_MAP: Record<string, [string, TechCategory]> = {
  django: ["Django", "FRAMEWORK"],
  flask: ["Flask", "FRAMEWORK"],
  fastapi: ["FastAPI", "FRAMEWORK"],
  uvicorn: ["Uvicorn", "TOOL"],
  sqlalchemy: ["SQLAlchemy", "TOOL"],
  psycopg2: ["PostgreSQL", "DATABASE"],
  pymongo: ["MongoDB", "DATABASE"],
  pytest: ["pytest", "TESTING"],
  boto3: ["AWS", "CLOUD"],
  pandas: ["pandas", "LIBRARY"],
  numpy: ["NumPy", "LIBRARY"],
  tensorflow: ["TensorFlow", "LIBRARY"],
  torch: ["PyTorch", "LIBRARY"],
  "scikit-learn": ["scikit-learn", "LIBRARY"],
  celery: ["Celery", "TOOL"],
  "spring-boot": ["Spring Boot", "FRAMEWORK"],
  junit: ["JUnit", "TESTING"],
  mockito: ["Mockito", "TESTING"],
  hibernate: ["Hibernate", "TOOL"],
  lombok: ["Lombok", "TOOL"],
  "gin-gonic/gin": ["Gin", "FRAMEWORK"],
  "gorm.io/gorm": ["GORM", "TOOL"],
};

export function extractEvidence(input: EvidenceInput): RepoEvidenceItem[] {
  const map = new Map<string, Acc>();
  const lowerPaths = input.filePaths.map((p) => p.toLowerCase());
  const base = new Set(lowerPaths.map((p) => p.split("/").pop() ?? p));

  const hasBase = (name: string) => base.has(name.toLowerCase());
  const hasBaseStarts = (prefix: string) => [...base].some((b) => b.startsWith(prefix));
  const hasPath = (re: RegExp) => lowerPaths.some((p) => re.test(p));
  const hasExt = (ext: string) => lowerPaths.some((p) => p.endsWith(ext));

  const add = (
    technology: string,
    category: TechCategory,
    strength: "USED" | "MENTIONED",
    confidence: number,
    proof: Proof,
  ) => {
    const key = technology.toLowerCase();
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { technology, category, strength, confidence, proofs: [proof] });
      return;
    }
    if (strength === USED) existing.strength = USED;
    existing.confidence = Math.max(existing.confidence, confidence);
    if (existing.category === "LIBRARY" && category !== "LIBRARY") existing.category = category;
    if (!existing.proofs.some((p) => p.detail === proof.detail)) existing.proofs.push(proof);
  };

  // 1) Languages — GitHub computes these from real source bytes → USED.
  for (const lang of input.primaryLanguages) {
    add(lang, "LANGUAGE", USED, 0.95, {
      detail: `${lang} source code detected by GitHub`,
      path: null,
    });
  }

  // 2) Structure / config detectors → USED (real implementation).
  if (hasBase("dockerfile") || hasPath(/(^|\/)docker-compose\.ya?ml$/)) {
    add("Docker", "DEPLOYMENT", USED, 0.95, { detail: "Dockerfile / docker-compose present", path: null });
  }
  if (hasPath(/^\.github\/workflows\//)) {
    add("GitHub Actions", "DEPLOYMENT", USED, 0.9, { detail: "CI workflow in .github/workflows", path: null });
  }
  if (hasBase("vercel.json")) add("Vercel", "DEPLOYMENT", USED, 0.9, { detail: "vercel.json present", path: "vercel.json" });
  if (hasBase("netlify.toml")) add("Netlify", "DEPLOYMENT", USED, 0.9, { detail: "netlify.toml present", path: "netlify.toml" });
  if (hasBase("procfile")) add("Heroku", "DEPLOYMENT", USED, 0.8, { detail: "Procfile present", path: null });
  if (hasPath(/(^|\/)serverless\.ya?ml$/)) add("Serverless", "DEPLOYMENT", USED, 0.85, { detail: "serverless.yml present", path: null });
  if (hasExt(".tf")) add("Terraform", "DEPLOYMENT", USED, 0.85, { detail: "Terraform (.tf) files present", path: null });
  if (hasPath(/(^|\/)(k8s|kubernetes)\//)) add("Kubernetes", "DEPLOYMENT", USED, 0.7, { detail: "Kubernetes manifests directory", path: null });

  if (hasBaseStarts("next.config")) add("Next.js", "FRAMEWORK", USED, 0.9, { detail: "next.config present", path: null });
  if (hasBaseStarts("tailwind.config")) add("Tailwind CSS", "FRAMEWORK", USED, 0.9, { detail: "tailwind.config present", path: null });
  if (hasBase("tsconfig.json") && (hasExt(".ts") || hasExt(".tsx"))) {
    add("TypeScript", "LANGUAGE", USED, 0.9, { detail: "tsconfig.json + TypeScript files", path: "tsconfig.json" });
  }
  if (hasBaseStarts("jest.config")) add("Jest", "TESTING", USED, 0.9, { detail: "jest.config present", path: null });
  if (hasBaseStarts("vitest.config")) add("Vitest", "TESTING", USED, 0.9, { detail: "vitest.config present", path: null });
  if (hasBaseStarts("playwright.config")) add("Playwright", "TESTING", USED, 0.9, { detail: "playwright.config present", path: null });
  if (hasBaseStarts("cypress.config") || hasPath(/(^|\/)cypress\//)) add("Cypress", "TESTING", USED, 0.85, { detail: "Cypress config/dir present", path: null });
  if (hasPath(/\.(test|spec)\.[jt]sx?$/) || hasPath(/(^|\/)(tests?|__tests__)\//)) {
    add("Automated tests", "TESTING", USED, 0.8, { detail: "Test files present (*.test / *.spec / tests dir)", path: null });
  }
  if (hasBaseStarts(".eslintrc") || hasBaseStarts("eslint.config")) add("ESLint", "TOOL", USED, 0.8, { detail: "ESLint config present", path: null });
  if (hasBaseStarts(".prettierrc") || hasBaseStarts("prettier.config")) add("Prettier", "TOOL", USED, 0.75, { detail: "Prettier config present", path: null });
  if (hasBase("pom.xml")) add("Maven", "TOOL", USED, 0.85, { detail: "pom.xml present", path: "pom.xml" });
  if (hasBaseStarts("build.gradle")) add("Gradle", "TOOL", USED, 0.85, { detail: "build.gradle present", path: null });
  if (hasBaseStarts("vite.config")) add("Vite", "TOOL", USED, 0.85, { detail: "vite.config present", path: null });
  if (hasBaseStarts("webpack.config")) add("Webpack", "TOOL", USED, 0.8, { detail: "webpack.config present", path: null });
  if (hasExt(".vue")) add("Vue", "FRAMEWORK", USED, 0.9, { detail: ".vue components present", path: null });
  if (hasExt(".svelte")) add("Svelte", "FRAMEWORK", USED, 0.9, { detail: ".svelte components present", path: null });

  // 3) Manifest dependencies → MENTIONED (with targeted USED corroboration).
  for (const m of input.manifests) {
    const lower = m.path.toLowerCase();
    if (lower.endsWith("package.json")) parsePackageJson(m, add, { hasExt });
    else if (lower.endsWith("schema.prisma")) parsePrisma(m, add);
    else parseTextManifest(m, add);
  }

  return [...map.values()].map((a) => ({
    technology: a.technology,
    category: a.category,
    strength: a.strength,
    confidence: a.confidence,
    source: "GITHUB_REPO" as const,
    proofs: a.proofs,
  }));
}

type AddFn = (
  technology: string,
  category: TechCategory,
  strength: "USED" | "MENTIONED",
  confidence: number,
  proof: Proof,
) => void;

function mapNpm(name: string): [string, TechCategory] | null {
  if (NPM_MAP[name]) return NPM_MAP[name];
  for (const [prefix, tech, category] of NPM_SCOPED) {
    if (name.startsWith(prefix)) return [tech, category];
  }
  return null;
}

function parsePackageJson(
  m: { path: string; content: string },
  add: AddFn,
  ctx: { hasExt: (ext: string) => boolean },
): void {
  let pkg: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
  try {
    pkg = JSON.parse(m.content);
  } catch {
    return;
  }
  const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  for (const name of Object.keys(deps)) {
    const mapped = mapNpm(name);
    if (!mapped) continue;
    const [tech, category] = mapped;
    // React is "used" when JSX/TSX files exist alongside the dependency.
    if (tech === "React" && (ctx.hasExt(".jsx") || ctx.hasExt(".tsx"))) {
      add(tech, category, "USED", 0.85, { detail: "react dependency + JSX/TSX files", path: m.path });
    } else {
      add(tech, category, "MENTIONED", 0.5, { detail: `Declared as a dependency in ${m.path}`, path: m.path });
    }
  }
}

function parsePrisma(m: { path: string; content: string }, add: AddFn): void {
  add("Prisma", "TOOL", "USED", 0.9, { detail: "prisma/schema.prisma present", path: m.path });
  const match = m.content.match(/provider\s*=\s*"(postgresql|mysql|sqlite|mongodb|sqlserver|cockroachdb)"/);
  if (!match) return;
  const provider = match[1];
  const dbNames: Record<string, string> = {
    postgresql: "PostgreSQL",
    mysql: "MySQL",
    sqlite: "SQLite",
    mongodb: "MongoDB",
    sqlserver: "SQL Server",
    cockroachdb: "CockroachDB",
  };
  add(dbNames[provider!]!, "DATABASE", "USED", 0.9, {
    detail: `Prisma datasource provider = ${provider}`,
    path: m.path,
  });
}

function parseTextManifest(m: { path: string; content: string }, add: AddFn): void {
  const haystack = m.content.toLowerCase();
  for (const [needle, [tech, category]] of Object.entries(TEXT_MAP)) {
    if (haystack.includes(needle)) {
      add(tech, category, "MENTIONED", 0.5, { detail: `Referenced in ${m.path}`, path: m.path });
    }
  }
}
