import { z } from "zod";
import { scoreSchema } from "./score";
import { proctoringReportSchema } from "./interview";

/**
 * Module 14 — Recruiter Dashboard. Recruiters search VERIFIED candidate profiles
 * by engineering requirements (real USED evidence), never resumes and never
 * private repositories. Deterministic — no LLM.
 */

export const candidateSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  headline: z.string().nullable(),
  location: z.string().nullable(),
  profileImage: z.string().nullable(),
  overall: z.number(),
  topStrengths: z.array(z.string()),
  verifiedSkillCount: z.number(),
  matchedSkills: z.array(z.string()),
  matchScore: z.number(),
  publicRepoCount: z.number(),
  shortlisted: z.boolean(),
  // Recruiter-facing hiring signals (filled by the student).
  college: z.string().nullable(),
  experienceYears: z.number().nullable(),
  availability: z.string().nullable(),
  expectedSalary: z.string().nullable(),
});
export type CandidateSummary = z.infer<typeof candidateSummarySchema>;

export const candidateSkillSchema = z.object({
  technology: z.string(),
  category: z.string(),
  repositoryCount: z.number(),
});
export type CandidateSkill = z.infer<typeof candidateSkillSchema>;

export const candidateRepoSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  language: z.string().nullable(),
  stars: z.number(),
  htmlUrl: z.string(),
});
export type CandidateRepo = z.infer<typeof candidateRepoSchema>;

/** A project shown on the candidate's full profile (from their passport). */
export const candidateProjectSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  url: z.string().nullable(),
});
export type CandidateProject = z.infer<typeof candidateProjectSchema>;

export const candidateProfileSchema = candidateSummarySchema.extend({
  about: z.string().nullable(),
  githubUsername: z.string().nullable(),
  portfolioSlug: z.string().nullable(),
  interviewScore: z.number().nullable(),
  interviewIntegrity: proctoringReportSchema.nullable(),
  scores: z.array(scoreSchema),
  verifiedSkills: z.array(candidateSkillSchema),
  topRepos: z.array(candidateRepoSchema),
  projects: z.array(candidateProjectSchema),
});
export type CandidateProfile = z.infer<typeof candidateProfileSchema>;

export const searchCandidatesRequestSchema = z.object({
  skills: z.array(z.string().trim().min(1)).max(20).default([]),
  minOverall: z.number().min(0).max(100).optional(),
});
export type SearchCandidatesInput = z.infer<typeof searchCandidatesRequestSchema>;

export const candidateSearchResultSchema = z.object({
  candidates: z.array(candidateSummarySchema),
  total: z.number(),
});
export type CandidateSearchResult = z.infer<typeof candidateSearchResultSchema>;

/** Self-serve role switch (Student ↔ Recruiter) so the two-sided app is usable. */
export const switchRoleRequestSchema = z.object({
  role: z.enum(["STUDENT", "RECRUITER"]),
});
export type SwitchRoleInput = z.infer<typeof switchRoleRequestSchema>;

/** Skills a recruiter can search by — drives the Find Talent autocomplete. The
 *  search still matches against real candidate evidence; this is just the input
 *  vocabulary so recruiters pick from a list instead of guessing spellings. */
export const SEARCHABLE_SKILLS = [
  "JavaScript", "TypeScript", "Python", "Java", "C", "C++", "C#", "Go", "Rust", "Kotlin", "Swift", "Ruby", "PHP",
  "Scala", "Dart", "R", "Objective-C", "Elixir", "Haskell", "Perl", "Lua", "Shell", "SQL", "MATLAB",
  "HTML", "CSS", "Sass", "Tailwind CSS", "Bootstrap", "React", "Next.js", "Vue.js", "Angular", "Svelte", "Redux",
  "jQuery", "Three.js", "WebGL", "Electron",
  "Node.js", "Express", "NestJS", "Django", "Flask", "FastAPI", "Spring", "Spring Boot", "Ruby on Rails", "Laravel",
  "ASP.NET", ".NET", "Phoenix", "Gin",
  "React Native", "Flutter", "Android", "iOS", "SwiftUI", "Jetpack Compose",
  "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "Cassandra", "DynamoDB", "Elasticsearch", "Neo4j", "MariaDB",
  "Firebase", "Supabase", "Prisma", "Sequelize", "TypeORM",
  "GraphQL", "REST", "gRPC", "WebSockets", "Socket.IO", "Microservices", "System Design",
  "Docker", "Kubernetes", "Terraform", "Ansible", "Helm", "Nginx", "Linux", "Bash", "Git",
  "AWS", "Azure", "Google Cloud", "GCP", "Vercel", "Netlify", "Heroku", "DigitalOcean", "Cloudflare",
  "CI/CD", "GitHub Actions", "Jenkins", "GitLab CI", "CircleCI",
  "Kafka", "RabbitMQ", "Celery", "Airflow", "Spark", "Hadoop",
  "Jest", "Cypress", "Playwright", "Pytest", "JUnit", "Selenium", "Vitest", "Mocha",
  "Webpack", "Vite", "Babel", "ESLint", "Prettier",
  "TensorFlow", "PyTorch", "scikit-learn", "Pandas", "NumPy", "OpenCV", "Keras", "Hugging Face", "LangChain",
  "OpenAI", "Machine Learning", "Deep Learning", "NLP", "Computer Vision", "Data Science",
  "Tableau", "Power BI", "Solidity", "Web3", "Ethereum", "Blockchain", "Unity", "Unreal Engine",
  "Data Structures", "Algorithms", "Operating Systems", "Computer Networks",
];
