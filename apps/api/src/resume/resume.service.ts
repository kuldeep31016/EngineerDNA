import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { Injectable } from "@nestjs/common";
import type { Prisma, ResumeReview as ResumeReviewRow, User } from "@prisma/client";
import { z } from "zod";
import { render } from "ejs";
import {
  tailoredResumeDataSchema,
  type DeveloperEvidence,
  type DeveloperDna,
  type ResumeReview,
  type ReviewResumeInput,
  type SavedResume,
  type SaveResumeInput,
  type TailoredResumeData,
  type TailorResumeInput,
  type TailorResumeResponse,
} from "@engineerdna/shared";
import { PrismaService } from "../prisma/prisma.service";
import { EvidenceService } from "../evidence/evidence.service";
import { DnaService } from "../dna/dna.service";
import { AnthropicService } from "../llm/anthropic.service";

const SYSTEM = `You are an expert technical recruiter and engineering resume coach.
You give specific, honest, actionable feedback and only suggest TRUTHFUL improvements grounded in the candidate's resume and their verified evidence — never fabricate experience, skills, or metrics.
Improve the EXISTING resume; do not write a new one.`;

const TAILOR_SYSTEM = `You are an expert resume writer who tailors engineering resumes to specific job descriptions.
Your job: REWRITE and REORDER the candidate's existing resume so it best matches the job description — same person, same facts, optimized for the role.
STRICT RULES:
- Never fabricate experience, employers, titles, dates, projects, metrics, or skills. Use only what is in the resume (you may reword bullets and re-emphasize relevant skills).
- Emphasize the skills, technologies, and outcomes the job description asks for — IF the resume supports them.
- Keep the resume concise and ATS-friendly: a strong summary, tight bullets, and clearly grouped skills.
- Mirror the job description's language for relevant keywords.
- Keep the same overall structure as the original resume (contact, summary, skills, experience, education, projects, certifications).`;

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

  /**
   * Review a resume against the candidate's evidence and DNA. Cost guard: if the
   * resume, the evidence, and the model are all unchanged since the last review,
   * the stored review is reused and NO LLM call is made.
   */
  async reviewResume(user: User, input: ReviewResumeInput): Promise<ResumeReview> {
    // Evidence is cheap (one query) and is part of the cache key, so fetch it
    // first and short-circuit before paying for the model.
    const evidence = await this.evidence.getDeveloperEvidence(user);
    const inputHash = hashInputs(input.resumeText, evidence);

    const existing = await this.prisma.resumeReview.findUnique({ where: { userId: user.id } });
    if (existing && existing.model === this.anthropic.model && existing.inputHash === inputHash) {
      return toContract(existing);
    }

    const dna = await this.dna.getDna(user);
    const body = await this.anthropic.generateObject<ReviewBody>({
      schema: reviewBodySchema,
      system: SYSTEM,
      prompt: buildPrompt(input.resumeText, evidence, dna),
    });

    const data = {
      resumeText: input.resumeText,
      inputHash,
      atsScore: clamp(body.atsScore),
      engineeringScore: clamp(body.engineeringScore),
      report: body as unknown as Prisma.InputJsonValue,
      model: this.anthropic.model,
    };

    const row = await this.prisma.resumeReview.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...data },
      update: data,
    });

    return toContract(row);
  }

  /** The user's latest review, or an unavailable placeholder. */
  async getReview(user: User): Promise<ResumeReview> {
    const row = await this.prisma.resumeReview.findUnique({ where: { userId: user.id } });
    return row ? toContract(row) : emptyReview();
  }

  /** The user's saved resume (the default source for tailoring). */
  async getSaved(user: User): Promise<SavedResume> {
    const profile = await this.ensureProfile(user.id);
    return {
      available: Boolean(profile.resumeText),
      fileName: profile.resumeFileName,
      resumeText: profile.resumeText,
      updatedAt: profile.updatedAt?.toISOString() ?? null,
    };
  }

  /** Persist a resume as the user's saved profile resume. */
  async saveResume(user: User, input: SaveResumeInput): Promise<SavedResume> {
    await this.prisma.profile.update({
      where: { userId: user.id },
      data: { resumeText: input.resumeText, resumeFileName: input.fileName ?? null },
    });
    return this.getSaved(user);
  }

  /**
   * Tailor the resume to a job description with AI. The model returns structured
   * resume data, which is rendered through the EJS template to a standalone HTML
   * document the browser can preview and print to PDF. No resume file ever leaves
   * the browser — only the extracted text.
   */
  async tailorToJd(user: User, input: TailorResumeInput): Promise<TailorResumeResponse> {
    const data = await this.anthropic.generateObject<TailoredResumeData>({
      // The schema carries defaults (input ≠ output type), so narrow it here.
      schema: tailoredResumeDataSchema as unknown as z.ZodType<TailoredResumeData>,
      system: TAILOR_SYSTEM,
      maxTokens: 8000,
      prompt: buildTailorPrompt(input.resumeText, input.jdText),
    });

    const html = render(template(), data);
    return { available: true, data, html, generatedAt: new Date().toISOString() };
  }

  private async ensureProfile(userId: string) {
    return this.prisma.profile.upsert({ where: { userId }, create: { userId }, update: {} });
  }
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** A deterministic fingerprint of the evidence that grounds a review. */
function evidenceSignature(evidence: DeveloperEvidence): string {
  return evidence.items
    .map((i) => `${i.strength}:${i.technology.toLowerCase()}`)
    .sort()
    .join("|");
}

/** Cache key over the inputs that actually change a review's result. */
function hashInputs(resumeText: string, evidence: DeveloperEvidence): string {
  const normalized = resumeText.trim().replace(/\s+/g, " ").toLowerCase();
  return createHash("sha256")
    .update(normalized)
    .update("::")
    .update(evidenceSignature(evidence))
    .digest("hex");
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

/** Load the EJS resume template (copied to dist by nest-cli assets). */
function template(): string {
  const path = join(__dirname, "templates", "resume.template.ejs");
  return readFileSync(path, "utf8");
}

/** Ground the tailor output in the resume text and the job description. */
function buildTailorPrompt(resumeText: string, jdText: string): string {
  return [
    "Rewrite the candidate's resume so it best fits the job description below.",
    "",
    "CANDIDATE'S CURRENT RESUME:",
    '"""',
    resumeText.slice(0, 16000),
    '"""',
    "",
    "JOB DESCRIPTION:",
    '"""',
    jdText.slice(0, 24000),
    '"""',
    "",
    "Produce the tailored resume as structured data:",
    "- contact: the candidate's real name and contact details (only what's in the resume; leave blank fields empty).",
    "- summary: 2-3 punchy sentences positioning the candidate for THIS role using the JD's key requirements.",
    "- skills: the most relevant skills for this role, grouped and ordered by relevance to the JD (only real skills from the resume).",
    "- experience: reorder entries if it helps (most relevant first), rewrite bullets to emphasize the JD's keywords and quantify impact where the resume supports it. Keep dates/companies truthful.",
    "- education: as in the resume.",
    "- projects: keep the most relevant ones for this role; describe them using JD language.",
    "- certifications: only real ones from the resume.",
    "",
    "Rules: strictly truthful. Never invent employers, schools, dates, links, skills, or metrics. Drop irrelevant detail rather than pad. Output ONLY the JSON object.",
  ].join("\n");
}
