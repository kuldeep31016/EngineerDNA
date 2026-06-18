import type { CareerIntelligence, Score } from "@engineerdna/shared";

/**
 * Deterministic Career Intelligence (Module 10). NO LLM. Turns the developer's
 * DNA dimension scores into grounded career guidance — archetype, realistic
 * roles, skill gaps, what to learn/build next, certifications and interview
 * topics. Every recommendation traces back to a DNA dimension.
 */

export interface CareerInput {
  overall: number;
  scores: Score[];
  topStrengths: string[];
}

type Guide = { reco: string; techs: string[]; cert?: string; interview?: string; role: string };

const GUIDE: Record<string, Guide> = {
  backend: { reco: "Build server-side services with a framework like NestJS, Express or Django.", techs: ["Node.js", "NestJS"], interview: "API design & databases", role: "Backend Engineer" },
  frontend: { reco: "Build polished UIs with React and TypeScript.", techs: ["React", "TypeScript"], interview: "JavaScript & React internals", role: "Frontend Engineer" },
  database: { reco: "Model data with PostgreSQL and an ORM like Prisma.", techs: ["PostgreSQL", "Prisma"], interview: "Data modeling & SQL", role: "Backend / Data Engineer" },
  devops: { reco: "Containerize a project and add CI/CD pipelines.", techs: ["Docker", "GitHub Actions"], cert: "Docker / Kubernetes fundamentals (CKA)", interview: "CI/CD & deployment", role: "DevOps / Platform Engineer" },
  cloud: { reco: "Deploy a project to the cloud and learn its core services.", techs: ["AWS", "Vercel"], cert: "AWS Certified Cloud Practitioner", interview: "Cloud architecture", role: "Cloud Engineer" },
  security: { reco: "Add authentication (JWT/OAuth) and learn the OWASP basics.", techs: ["JWT", "OAuth"], interview: "Authentication & web security", role: "Backend Engineer" },
  testing: { reco: "Add automated tests (Jest, Vitest or Pytest) to your projects.", techs: ["Jest", "Pytest"], interview: "Testing strategy", role: "Software Engineer" },
  api: { reco: "Design clean REST or GraphQL APIs with clear contracts.", techs: ["GraphQL", "OpenAPI"], interview: "API design", role: "Backend Engineer" },
  systemdesign: { reco: "Study system design — caching, queues, and horizontal scaling.", techs: [], interview: "System design fundamentals", role: "Software Engineer" },
  aiml: { reco: "Build an end-to-end ML project on real data.", techs: ["TensorFlow", "PyTorch"], cert: "TensorFlow Developer Certificate", interview: "ML fundamentals", role: "ML Engineer" },
};

export function computeCareer(input: CareerInput): Omit<CareerIntelligence, "generatedAt"> {
  const v = new Map(input.scores.map((s) => [s.key, s.value]));
  const get = (k: string) => v.get(k) ?? 0;
  const available = input.overall > 0;

  if (!available) {
    return {
      available: false,
      archetype: { title: "Emerging Engineer", reasoning: "Analyze repositories and build evidence to reveal your Developer DNA." },
      roles: [],
      companies: ["Open-source projects & internships to start building evidence"],
      skillGaps: [],
      learnNext: [],
      nextProject: "Pick a small project, build it end-to-end, then connect GitHub so EngineerDNA can analyze it.",
      certifications: [],
      interviewTopics: ["Data structures & algorithms"],
    };
  }

  const backend = get("backend"), frontend = get("frontend"), aiml = get("aiml"), data = get("database"), devops = get("devops");

  // ---- Archetype ----
  let primary: string;
  if (aiml >= 50 && aiml >= backend && aiml >= frontend) primary = "Machine Learning Engineer";
  else if (backend >= 50 && frontend >= 50) primary = "Full-Stack Engineer";
  else if (backend >= frontend) primary = "Backend Engineer";
  else primary = "Frontend Engineer";
  let suffix = "";
  if (devops >= 60) suffix = " (Platform-leaning)";
  else if (data >= 60 && primary === "Backend Engineer") suffix = " (Data-focused)";
  const archetype = {
    title: primary + suffix,
    reasoning: `Your strongest areas are ${input.topStrengths.slice(0, 3).join(", ") || "still forming"}.`,
  };

  // ---- Tier ----
  const tier = input.overall >= 70 ? "Mid–Senior" : input.overall >= 45 ? "Junior–Mid" : "Intern / Junior";

  // ---- Roles (from the strongest dimensions) ----
  const strong = [...input.scores].filter((s) => s.value >= 40).sort((a, b) => b.value - a.value);
  const seenRole = new Set<string>();
  const roles = strong
    .map((s) => GUIDE[s.key]?.role)
    .filter((r): r is string => !!r && !seenRole.has(r) && !!seenRole.add(r))
    .slice(0, 3)
    .map((title) => ({ title: `${title} (${tier})`, fit: `Backed by your verified strength in ${strong.find((s) => GUIDE[s.key]?.role === title)?.label ?? "this area"}.` }));
  if (roles.length === 0) roles.push({ title: `Software Engineer (${tier})`, fit: "Build more evidence to sharpen role fit." });

  // ---- Companies ----
  const companies =
    input.overall >= 75
      ? ["Big Tech (Google, Meta, Amazon-tier)", "High-growth scale-ups"]
      : input.overall >= 50
        ? ["Funded startups & scale-ups (Series A–C)", "Mid-size product companies"]
        : input.overall >= 25
          ? ["Early-stage startups", "Internships & apprenticeships"]
          : ["Open-source projects & internships to build evidence"];

  // ---- Skill gaps (weakest meaningful dimensions) ----
  const gapDims = [...input.scores]
    .filter((s) => s.value < 55 && GUIDE[s.key])
    .sort((a, b) => a.value - b.value)
    .slice(0, 3);
  const skillGaps = gapDims.map((s) => ({ label: s.label, value: s.value, recommendation: GUIDE[s.key]!.reco }));

  // ---- Learn next (techs from the gaps) ----
  const learnNext = [...new Set(gapDims.flatMap((s) => GUIDE[s.key]!.techs))].slice(0, 5);

  // ---- Next project ----
  const flavour =
    primary.startsWith("Frontend")
      ? "a polished React + TypeScript dashboard with tests and CI"
      : primary.startsWith("Machine")
        ? "an end-to-end ML pipeline with reproducible training and evaluation"
        : "a containerized REST API with authentication, a Postgres database and a full test suite";
  const nextProject =
    gapDims.length > 0
      ? `Build ${flavour} — it exercises ${gapDims.map((s) => s.label).join(", ")}${learnNext.length ? ` using ${learnNext.join(", ")}` : ""}.`
      : `Ship an ambitious project in your strongest area end-to-end, with tests and a real deployment.`;

  // ---- Certifications ----
  const certifications = [...new Set(gapDims.map((s) => GUIDE[s.key]!.cert).filter((c): c is string => !!c))].slice(0, 2);
  if (certifications.length === 0) certifications.push("Certifications are optional — shipping evidence-backed projects matters more.");

  // ---- Interview topics ----
  const topics = new Set<string>(["Data structures & algorithms"]);
  const primaryKey = primary.startsWith("Frontend") ? "frontend" : primary.startsWith("Machine") ? "aiml" : "backend";
  if (GUIDE[primaryKey]?.interview) topics.add(GUIDE[primaryKey]!.interview!);
  if (get("systemdesign") < 60) topics.add("System design fundamentals");
  for (const s of gapDims) if (GUIDE[s.key]?.interview) topics.add(GUIDE[s.key]!.interview!);
  const interviewTopics = [...topics].slice(0, 5);

  return { available, archetype, roles, companies, skillGaps, learnNext, nextProject, certifications, interviewTopics };
}
