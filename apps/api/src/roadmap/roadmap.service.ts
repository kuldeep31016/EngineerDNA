import { Injectable } from "@nestjs/common";
import type { LearningRoadmap as RoadmapRow, Prisma, User } from "@prisma/client";
import { z } from "zod";
import type {
  DeveloperDna,
  DeveloperEvidence,
  GenerateRoadmapInput,
  InterviewRole,
  LearningRoadmap,
  RoadmapStatus,
} from "@engineerdna/shared";
import { PrismaService } from "../prisma/prisma.service";
import { EvidenceService } from "../evidence/evidence.service";
import { DnaService } from "../dna/dna.service";
import { AnthropicService } from "../llm/anthropic.service";

const SYSTEM = `You are a senior engineering mentor who designs personalized learning roadmaps.
Produce a clear, motivating path from foundations to mastery for the candidate's target role.
Be concrete and practical — every skill names a real project to build it and honest resources (titles, not URLs). Never invent the candidate's experience.`;

const ROLE_LABELS: Record<InterviewRole, string> = {
  frontend: "Frontend Developer",
  backend: "Backend Developer",
  fullstack: "Full-Stack Developer",
  cloud: "Cloud / DevOps Engineer",
  dsa: "DSA / Problem Solving",
  aiml: "AI / ML Engineer",
  data: "Data Engineer",
};

const CATEGORIES = [
  "frontend",
  "backend",
  "database",
  "devops",
  "cloud",
  "testing",
  "language",
  "api",
  "security",
  "aiml",
  "data",
  "tool",
  "fundamentals",
];

// What the model returns (no ids, no status — those are computed by us).
const genSchema = z.object({
  summary: z.string(),
  stages: z.array(
    z.object({
      title: z.string(),
      subtitle: z.string(),
      nodes: z.array(
        z.object({
          skill: z.string(),
          category: z.string(),
          why: z.string(),
          project: z.string(),
          resources: z.array(z.string()),
          estimate: z.string(),
        }),
      ),
    }),
  ),
});
type GenBody = z.infer<typeof genSchema>;
type RawStage = GenBody["stages"][number];

@Injectable()
export class RoadmapService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly evidence: EvidenceService,
    private readonly dna: DnaService,
    private readonly anthropic: AnthropicService,
  ) {}

  /** The user's roadmap with status recomputed from current evidence. */
  async getRoadmap(user: User): Promise<LearningRoadmap> {
    const row = await this.prisma.learningRoadmap.findUnique({ where: { userId: user.id } });
    if (!row) return emptyRoadmap();
    const evidence = await this.evidence.getDeveloperEvidence(user);
    return assemble(row, evidence);
  }

  /**
   * Generate a roadmap for a role. Cost guard: the path for a role is stable, so
   * the same role + model is reused (no LLM) unless `regenerate` is set. Node
   * status is always recomputed live from evidence — progress updates for free.
   */
  async generateRoadmap(user: User, input: GenerateRoadmapInput): Promise<LearningRoadmap> {
    const existing = await this.prisma.learningRoadmap.findUnique({ where: { userId: user.id } });
    const reuse =
      existing && existing.role === input.role && existing.model === this.anthropic.model && !input.regenerate;

    let row = existing;
    if (!reuse) {
      const dna = await this.dna.getDna(user);
      const gen = await this.anthropic.generateObject<GenBody>({
        schema: genSchema,
        system: SYSTEM,
        prompt: buildPrompt(input.role, dna),
      });
      const data = {
        role: input.role,
        summary: gen.summary,
        stages: gen.stages as unknown as Prisma.InputJsonValue,
        model: this.anthropic.model,
      };
      row = await this.prisma.learningRoadmap.upsert({
        where: { userId: user.id },
        create: { userId: user.id, ...data },
        update: data,
      });
    }

    const evidence = await this.evidence.getDeveloperEvidence(user);
    return assemble(row!, evidence);
  }
}

function emptyRoadmap(): LearningRoadmap {
  return {
    available: false,
    goal: "",
    summary: "",
    progress: 0,
    totalSkills: 0,
    completedSkills: 0,
    stages: [],
    generatedAt: "",
  };
}

/** Attach live status (from evidence) and progress to the stored stages. */
function assemble(row: RoadmapRow, evidence: DeveloperEvidence): LearningRoadmap {
  const used = new Set(evidence.items.filter((i) => i.strength === "USED").map((i) => norm(i.technology)));
  const mentioned = new Set(
    evidence.items.filter((i) => i.strength === "MENTIONED").map((i) => norm(i.technology)),
  );

  const rawStages = (row.stages as unknown as RawStage[]) ?? [];
  let total = 0;
  let completed = 0;
  let counter = 0;

  const stages = rawStages.map((stage) => ({
    title: stage.title,
    subtitle: stage.subtitle,
    nodes: stage.nodes.map((node) => {
      const status = statusFor(node.skill, used, mentioned);
      total += 1;
      if (status === "done") completed += 1;
      return {
        id: `n${(counter += 1)}`,
        skill: node.skill,
        category: CATEGORIES.includes(node.category) ? node.category : "fundamentals",
        status,
        why: node.why,
        project: node.project,
        resources: node.resources,
        estimate: node.estimate,
      };
    }),
  }));

  return {
    available: true,
    goal: ROLE_LABELS[row.role as InterviewRole] ?? "Engineer",
    summary: row.summary,
    progress: total ? Math.round((completed / total) * 100) : 0,
    totalSkills: total,
    completedSkills: completed,
    stages,
    generatedAt: row.updatedAt.toISOString(),
  };
}

/** Normalize a technology/skill name for matching. */
function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/\.js$/i, "")
    .replace(/[^a-z0-9+#]/g, "");
}

function statusFor(skill: string, used: Set<string>, mentioned: Set<string>): RoadmapStatus {
  const n = norm(skill);
  if (!n) return "todo";
  const hit = (set: Set<string>) =>
    set.has(n) || [...set].some((t) => t.length >= 3 && (t.includes(n) || n.includes(t)));
  if (hit(used)) return "done";
  if (hit(mentioned)) return "learning";
  return "todo";
}

function buildPrompt(role: InterviewRole, dna: DeveloperDna): string {
  const strong = dna.scores.filter((s) => s.value >= 55).map((s) => s.label);
  return [
    `Design a learning roadmap to become a strong ${ROLE_LABELS[role]}.`,
    `The candidate's current strong areas: ${strong.join(", ") || "(early-stage; assume fundamentals)"} (overall ${dna.overall}/100).`,
    "",
    "Rules:",
    "- 4 to 5 ordered stages from foundations to mastery (e.g. Foundations, Core, Advanced, Specialization, Mastery). Each stage has a short subtitle.",
    "- 3 to 5 skill nodes per stage. Cover the full path even for skills they may already have — status is computed separately.",
    `- Each node: skill (a concrete technology or concept), category (one of: ${CATEGORIES.join(", ")}), why it matters (1 sentence), project (a specific thing to build to learn it), resources (2-4 honest titles, NOT URLs), estimate (e.g. "1-2 weeks").`,
    "- Keep it practical and motivating, like a senior mentor guiding a junior.",
    "- summary: 1-2 sentences framing the journey.",
  ].join("\n");
}
