import type { AnalysisReport, RepoEvidenceItem, Score, Verdict } from "@engineerdna/shared";
import { canonicalTech } from "../verification/skill-matcher";

/**
 * Deterministic Project Intelligence (Module 9). NO LLM. Scores a repository's
 * quality across several dimensions from its evidence (Module 6) and analysis
 * report (Module 5), with a transparent reason for every score.
 */

export interface ProjectInput {
  repoName: string;
  report: AnalysisReport | null;
  evidence: RepoEvidenceItem[];
}

export interface ProjectResult {
  available: boolean;
  overall: Score;
  dimensions: Score[];
  verdicts: Verdict[];
  improvements: string[];
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

function qualityLevel(v: number): string {
  if (v <= 0) return "No data";
  if (v < 35) return "Weak";
  if (v < 60) return "Fair";
  if (v < 80) return "Good";
  return "Excellent";
}

// Names that strongly suggest a tutorial / clone project (heuristic only).
const CLONE_PATTERNS =
  /clone|tutorial|todo|boilerplate|starter|netflix|twitter|instagram|youtube|spotify|ecommerce|e-commerce|crud|practice|learn/i;

export function computeProjectIntelligence(input: ProjectInput): ProjectResult {
  const { repoName, report, evidence } = input;
  const used = evidence.filter((e) => e.strength === "USED");
  const usedCats = new Set(used.map((e) => e.category));
  const usedKeys = new Set(used.map((e) => canonicalTech(e.technology)));

  const hasCat = (c: string) => usedCats.has(c as RepoEvidenceItem["category"]);
  const hasTech = (name: string) => usedKeys.has(canonicalTech(name));
  const hasFramework = hasCat("FRAMEWORK");
  const hasBackend = ["express", "nestjs", "django", "flask", "fastapi", "springboot", "node", "go", "gin"].some(hasTech);

  const available = used.length > 0 || report !== null;

  // ---- Difficulty (a descriptor, not "higher = better") ----
  let difficultyVal: number;
  let difficultyReason: string;
  if (report) {
    difficultyVal = { beginner: 30, intermediate: 62, advanced: 86 }[report.complexity.level];
    difficultyReason = report.complexity.reasoning;
  } else {
    difficultyVal = clamp(usedCats.size * 12 + used.length * 3);
    difficultyReason = `${used.length} technologies used across ${usedCats.size} categories.`;
  }
  const difficulty: Score = {
    key: "difficulty",
    label: "Difficulty",
    value: clamp(difficultyVal),
    level: difficultyVal < 40 ? "Beginner" : difficultyVal < 72 ? "Intermediate" : "Advanced",
    reasoning: difficultyReason,
    evidenceRefs: report ? [report.complexity.level] : [...usedCats],
  };

  // ---- Production readiness ----
  const prSignals: string[] = [];
  let pr = 0;
  if (hasCat("DEPLOYMENT")) { pr += 28; prSignals.push("deployment/CI configured"); }
  if (hasCat("TESTING")) { pr += 26; prSignals.push("automated tests present"); }
  if (hasCat("DATABASE")) { pr += 16; prSignals.push("uses a database"); }
  if (hasCat("AUTH")) { pr += 16; prSignals.push("authentication present"); }
  if (hasFramework) { pr += 14; prSignals.push("built on a framework"); }
  const productionReadiness: Score = {
    key: "production",
    label: "Production Readiness",
    value: clamp(pr),
    level: qualityLevel(clamp(pr)),
    reasoning: prSignals.length ? `Signals: ${prSignals.join(", ")}.` : "Few production signals detected.",
    evidenceRefs: prSignals,
  };

  // ---- Architecture ----
  let arch = 35;
  if (hasFramework) arch += 22;
  if (hasCat("TESTING")) arch += 14;
  if (hasCat("DEPLOYMENT")) arch += 14;
  if (hasTech("typescript") || hasTech("prisma") || hasTech("typeorm")) arch += 12;
  if (report) arch -= report.missingBestPractices.length * 5;
  const architecture: Score = {
    key: "architecture",
    label: "Architecture",
    value: clamp(arch),
    level: qualityLevel(clamp(arch)),
    reasoning: report
      ? `${report.missingBestPractices.length} missing best practice(s); ${hasFramework ? "structured around a framework" : "no clear framework structure"}.`
      : hasFramework
        ? "Structured around a recognized framework."
        : "Limited architecture signals from evidence.",
    evidenceRefs: [...usedCats],
  };

  // ---- Scalability ----
  let scale = 20;
  const scaleSig: string[] = [];
  if (hasTech("docker")) { scale += 22; scaleSig.push("containerized"); }
  if (hasTech("kubernetes")) { scale += 20; scaleSig.push("Kubernetes"); }
  if (hasCat("DATABASE")) { scale += 16; scaleSig.push("database-backed"); }
  if (hasTech("redis")) { scale += 14; scaleSig.push("caching"); }
  if (hasCat("CLOUD")) { scale += 14; scaleSig.push("cloud services"); }
  const scalability: Score = {
    key: "scalability",
    label: "Scalability",
    value: clamp(scale),
    level: qualityLevel(clamp(scale)),
    reasoning: scaleSig.length ? `Supported by: ${scaleSig.join(", ")}.` : "Few scalability signals (no containers, cache, or cloud).",
    evidenceRefs: scaleSig,
  };

  // ---- Security ----
  let sec = 25;
  const secSig: string[] = [];
  if (hasCat("AUTH")) { sec += 45; secSig.push("authentication"); }
  if (hasCat("DEPLOYMENT")) { sec += 12; }
  if (hasCat("TESTING")) { sec += 10; }
  if (!hasCat("AUTH") && hasBackend) { sec -= 10; secSig.push("no authentication on a backend service"); }
  const security: Score = {
    key: "security",
    label: "Security",
    value: clamp(sec),
    level: qualityLevel(clamp(sec)),
    reasoning: hasCat("AUTH")
      ? `Auth present (${used.filter((e) => e.category === "AUTH").map((e) => e.technology).join(", ")}).`
      : hasBackend
        ? "Backend service with no detected authentication."
        : "No sensitive surface detected; limited security signals.",
    evidenceRefs: used.filter((e) => e.category === "AUTH").map((e) => e.technology),
  };

  // ---- Testing ----
  const testingVal = hasCat("TESTING") ? 85 : report && /no test|missing test|no automated/i.test(report.testing) ? 8 : 18;
  const testing: Score = {
    key: "testing",
    label: "Testing",
    value: testingVal,
    level: qualityLevel(testingVal),
    reasoning: hasCat("TESTING")
      ? `Tests detected (${used.filter((e) => e.category === "TESTING").map((e) => e.technology).join(", ")}).`
      : "No automated tests detected.",
    evidenceRefs: used.filter((e) => e.category === "TESTING").map((e) => e.technology),
  };

  const dimensions = [difficulty, productionReadiness, architecture, scalability, security, testing];

  // ---- Overall Project Quality Score (difficulty is informational, excluded) ----
  const qualityDims = [
    [productionReadiness.value, 0.25],
    [architecture.value, 0.2],
    [testing.value, 0.2],
    [scalability.value, 0.15],
    [security.value, 0.2],
  ] as const;
  const overallVal = clamp(qualityDims.reduce((s, [v, w]) => s + v * w, 0));
  const overall: Score = {
    key: "quality",
    label: "Project Quality",
    value: overallVal,
    level: qualityLevel(overallVal),
    reasoning: `Weighted across production readiness, architecture, testing, scalability and security.`,
    evidenceRefs: [],
  };

  // ---- Verdicts ----
  const isClone = CLONE_PATTERNS.test(repoName);
  const verdicts: Verdict[] = [
    { label: "Production-ready", value: pr >= 70 ? "Yes" : pr >= 40 ? "Partially" : "No", positive: pr >= 70 },
    { label: "Architecture", value: arch >= 70 ? "Solid" : arch >= 45 ? "Reasonable" : "Basic", positive: arch >= 70 },
    { label: "Scalable", value: scale >= 60 ? "Yes" : scale >= 35 ? "Somewhat" : "Limited", positive: scale >= 60 },
    { label: "Secure", value: sec >= 60 ? "Reasonable" : "Needs work", positive: sec >= 60 },
    {
      label: "Originality",
      value: isClone ? "Looks like a tutorial-style project" : "Likely original work",
      positive: !isClone,
    },
  ];

  // ---- Path to industry-ready ----
  const improvements: string[] = [];
  if (!hasCat("TESTING")) improvements.push("Add automated tests to raise reliability and confidence.");
  if (!hasCat("DEPLOYMENT")) improvements.push("Add a Dockerfile and CI workflow so it can ship reproducibly.");
  if (!hasCat("AUTH") && hasBackend) improvements.push("Add authentication/authorization to secure the API.");
  if (!hasTech("docker") && hasBackend) improvements.push("Containerize the service for consistent deployment.");
  for (const s of report?.suggestedImprovements ?? []) {
    if (improvements.length >= 6) break;
    if (!improvements.includes(s)) improvements.push(s);
  }

  return { available, overall, dimensions, verdicts, improvements: improvements.slice(0, 6) };
}
