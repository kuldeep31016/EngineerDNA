import { Injectable } from "@nestjs/common";
import type { Prisma, ResumeReview as ResumeReviewRow, User } from "@prisma/client";
import { z } from "zod";
import type { DeveloperEvidence, DeveloperDna, ResumeReview, ReviewResumeInput } from "@engineerdna/shared";
import { PrismaService } from "../prisma/prisma.service";
import { EvidenceService } from "../evidence/evidence.service";
import { DnaService } from "../dna/dna.service";
import { AnthropicService } from "../llm/anthropic.service";

const SYSTEM = `You are an expert technical recruiter and engineering resume coach.
You give specific, honest, actionable feedback and only suggest TRUTHFUL improvements grounded in the candidate's resume and their verified evidence — never fabricate experience, skills, or metrics.
Improve the EXISTING resume; do not write a new one.`;

// The model returns the review body; we add `available` and `generatedAt`.
const reviewBodySchema = z.object({
  atsScore: z.number(),
  engineeringScore: z.number(),
  summary: z.string(),
  strengths: z.array(z.string()),
  claimedNotVerified: z.array(z.string()),
  verifiedNotHighlighted: z.array(z.string()),
  inconsistencies: z.array(z.string()),
  atsIssues: z.array(z.string()),
  missingKeywords: z.array(z.string()),
  rewrites: z.array(z.object({ section: z.string(), original: z.string(), improved: z.string() })),
  structure: z.array(z.string()),
});
type ReviewBody = z.infer<typeof reviewBodySchema>;

@Injectable()
export class ResumeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly evidence: EvidenceService,
    private readonly dna: DnaService,
    private readonly anthropic: AnthropicService,
  ) {}

  /** Review a resume against the candidate's evidence and DNA. One LLM call. */
  async reviewResume(user: User, input: ReviewResumeInput): Promise<ResumeReview> {
    const [evidence, dna] = await Promise.all([
      this.evidence.getDeveloperEvidence(user),
      this.dna.getDna(user),
    ]);

    const body = await this.anthropic.generateObject<ReviewBody>({
      schema: reviewBodySchema,
      system: SYSTEM,
      prompt: buildPrompt(input.resumeText, evidence, dna),
    });

    const row = await this.prisma.resumeReview.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        resumeText: input.resumeText,
        atsScore: clamp(body.atsScore),
        engineeringScore: clamp(body.engineeringScore),
        report: body as unknown as Prisma.InputJsonValue,
        model: this.anthropic.model,
      },
      update: {
        resumeText: input.resumeText,
        atsScore: clamp(body.atsScore),
        engineeringScore: clamp(body.engineeringScore),
        report: body as unknown as Prisma.InputJsonValue,
        model: this.anthropic.model,
      },
    });

    return toContract(row);
  }

  /** The user's latest review, or an unavailable placeholder. */
  async getReview(user: User): Promise<ResumeReview> {
    const row = await this.prisma.resumeReview.findUnique({ where: { userId: user.id } });
    return row ? toContract(row) : emptyReview();
  }
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function emptyReview(): ResumeReview {
  return {
    available: false,
    atsScore: 0,
    engineeringScore: 0,
    summary: "",
    strengths: [],
    claimedNotVerified: [],
    verifiedNotHighlighted: [],
    inconsistencies: [],
    atsIssues: [],
    missingKeywords: [],
    rewrites: [],
    structure: [],
    generatedAt: "",
  };
}

function toContract(row: ResumeReviewRow): ResumeReview {
  const body = row.report as unknown as ReviewBody;
  return {
    available: true,
    atsScore: row.atsScore,
    engineeringScore: row.engineeringScore,
    summary: body.summary,
    strengths: body.strengths ?? [],
    claimedNotVerified: body.claimedNotVerified ?? [],
    verifiedNotHighlighted: body.verifiedNotHighlighted ?? [],
    inconsistencies: body.inconsistencies ?? [],
    atsIssues: body.atsIssues ?? [],
    missingKeywords: body.missingKeywords ?? [],
    rewrites: body.rewrites ?? [],
    structure: body.structure ?? [],
    generatedAt: row.updatedAt.toISOString(),
  };
}

/** Ground the review in the resume text, verified evidence, and DNA. */
function buildPrompt(resumeText: string, evidence: DeveloperEvidence, dna: DeveloperDna): string {
  const used = evidence.items.filter((i) => i.strength === "USED").map((i) => i.technology);
  const mentioned = evidence.items.filter((i) => i.strength === "MENTIONED").map((i) => i.technology);
  const strongDims = dna.scores.filter((s) => s.value >= 55).map((s) => `${s.label} (${s.level})`);

  return [
    "Review and improve this candidate's engineering resume.",
    "",
    "RESUME:",
    '"""',
    resumeText.slice(0, 12000),
    '"""',
    "",
    "VERIFIED EVIDENCE — technologies the candidate has actually USED in real repositories:",
    used.length ? used.join(", ") : "(none yet)",
    "",
    "Merely MENTIONED (declared as a dependency but not proven):",
    mentioned.length ? mentioned.join(", ") : "(none)",
    "",
    `DEVELOPER DNA: overall ${dna.overall}/100. Strong areas: ${strongDims.join(", ") || "(none yet)"}. Top strengths: ${dna.topStrengths.join(", ") || "(none)"}.`,
    "",
    "Produce a thorough, honest review:",
    "- atsScore (0-100): how well it passes Applicant Tracking Systems (formatting, keywords, parseability).",
    "- engineeringScore (0-100): overall strength as an engineering resume.",
    "- summary: 2-3 sentence honest overview.",
    "- strengths: what already works well.",
    "- claimedNotVerified: skills/claims in the resume NOT backed by the verified evidence (credibility risks; be specific).",
    "- verifiedNotHighlighted: technologies clearly USED (evidence) that the resume omits or under-sells.",
    "- inconsistencies: contradictions, vague or unverifiable claims, or dubious metrics.",
    "- atsIssues: concrete ATS/formatting problems.",
    "- missingKeywords: important role keywords to add — only ones justified by their evidence or experience.",
    "- rewrites: 3-6 weak bullets rewritten stronger. Each: section, original (close to verbatim), improved. Improvements MUST stay truthful to the resume/evidence; never invent achievements or numbers.",
    "- structure: ordering, structure, and removal recommendations.",
  ].join("\n");
}
