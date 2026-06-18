import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { Interview as InterviewRow, Prisma, User } from "@prisma/client";
import { z } from "zod";
import {
  interviewReportSchema,
  type Interview,
  type InterviewAnswer,
  type InterviewListItem,
  type InterviewQuestion,
  type InterviewReport,
  type InterviewRole,
  type StartInterviewInput,
  type StartInterviewResult,
  type SubmitAnswersInput,
} from "@engineerdna/shared";
import { PrismaService } from "../prisma/prisma.service";
import { EvidenceService } from "../evidence/evidence.service";
import { AnthropicService } from "../llm/anthropic.service";
import { selectInterviewTopics, type InterviewTopic } from "./interview-topics";

const GEN_SYSTEM = `You are a friendly but rigorous technical interviewer conducting a live, spoken mock interview.
Ground questions in the candidate's chosen role, their resume, and their VERIFIED engineering evidence — never invent experience they don't have.
Questions are spoken aloud, so keep them natural and conversational. Software-engineering interviews only — design, trade-offs, debugging, real experience — NEVER competitive-programming puzzles.`;

// Human label + focus description per role, used to steer question generation.
const ROLE_LABELS: Record<InterviewRole, string> = {
  frontend: "Frontend Developer",
  backend: "Backend Developer",
  fullstack: "Full-Stack Developer",
  cloud: "Cloud / DevOps Engineer",
  dsa: "DSA / Problem Solving",
  aiml: "AI / ML Engineer",
  data: "Data Engineer",
};

const ROLE_FOCUS: Record<InterviewRole, string> = {
  frontend: "UI architecture, React/state management, performance, accessibility, CSS, and browser APIs",
  backend: "API design, databases, authentication, caching, concurrency, and system design",
  fullstack: "frontend and backend engineering and how they integrate end to end",
  cloud: "deployment, CI/CD, containers, infrastructure as code, scalability, and observability",
  dsa: "data structures, algorithms, complexity analysis, and problem-solving approach (spoken, conceptual — not live coding)",
  aiml: "data pipelines, model training and evaluation, deployment, and MLOps",
  data: "data pipelines, warehousing, SQL, batch and stream processing, and data modeling",
};

const EVAL_SYSTEM = `You are an experienced, fair technical interviewer grading a candidate's answers.
Score strictly but constructively, based ONLY on what the candidate actually wrote. Reward correct engineering reasoning even when phrased simply; penalize vague, wrong, or missing answers.
Return feedback for EVERY question id provided.`;

// What the model returns when generating questions (ids are assigned by us).
const generatedQuestionsSchema = z.object({
  questions: z.array(
    z.object({
      topic: z.string(),
      difficulty: z.enum(["easy", "medium", "hard"]),
      prompt: z.string(),
      rationale: z.string(),
    }),
  ),
});

@Injectable()
export class InterviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly evidence: EvidenceService,
    private readonly anthropic: AnthropicService,
  ) {}

  /**
   * Generate a personalized, spoken interview for the chosen role — grounded in
   * the candidate's resume and their verified evidence. One LLM call (batched)
   * keeps cost to a single request per interview.
   */
  async startInterview(user: User, input: StartInterviewInput): Promise<StartInterviewResult> {
    const evidence = await this.evidence.getDeveloperEvidence(user);
    const topics = selectInterviewTopics(evidence.items);
    const candidateName = input.candidateName?.trim() || user.name || "there";

    const generated = await this.anthropic.generateObject({
      schema: generatedQuestionsSchema,
      system: GEN_SYSTEM,
      prompt: buildGenerationPrompt({
        role: input.role,
        candidateName,
        resumeText: input.resumeText,
        topics,
      }),
    });

    const questions: InterviewQuestion[] = generated.questions.map((q, i) => ({
      id: `q${i + 1}`,
      ...q,
    }));

    const displayTopics = topics.length ? topics.map((t) => t.theme) : [ROLE_LABELS[input.role]];

    const row = await this.prisma.interview.create({
      data: {
        userId: user.id,
        status: "GENERATED",
        role: input.role,
        candidateName: input.candidateName?.trim() || user.name || null,
        topics: displayTopics,
        questions: questions as unknown as Prisma.InputJsonValue,
        answers: [],
        model: this.anthropic.model,
      },
    });

    return { available: true, reason: null, interview: toContract(row) };
  }

  /** Grade submitted answers in a single batched LLM call and store the report. */
  async submitAnswers(user: User, interviewId: string, input: SubmitAnswersInput): Promise<Interview> {
    const row = await this.requireOwned(user, interviewId);
    if (row.status === "EVALUATED") {
      throw new ConflictException("This interview has already been evaluated.");
    }

    const questions = (row.questions as unknown as InterviewQuestion[]) ?? [];
    const report = await this.anthropic.generateObject<InterviewReport>({
      schema: interviewReportSchema,
      system: EVAL_SYSTEM,
      prompt: buildEvaluationPrompt(questions, input.answers),
    });

    const updated = await this.prisma.interview.update({
      where: { id: row.id },
      data: {
        status: "EVALUATED",
        answers: input.answers as unknown as Prisma.InputJsonValue,
        report: report as unknown as Prisma.InputJsonValue,
        overallScore: Math.round(report.overallScore),
        evaluatedAt: new Date(),
      },
    });

    return toContract(updated);
  }

  /** Past interviews, newest first — the basis for "improvement over time". */
  async listInterviews(user: User): Promise<InterviewListItem[]> {
    const rows = await this.prisma.interview.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => ({
      id: r.id,
      status: r.status,
      role: r.role ?? null,
      topics: (r.topics as string[]) ?? [],
      questionCount: ((r.questions as unknown[]) ?? []).length,
      overallScore: r.overallScore,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  /** A single interview the caller owns. */
  async getInterview(user: User, id: string): Promise<Interview> {
    return toContract(await this.requireOwned(user, id));
  }

  private async requireOwned(user: User, id: string): Promise<InterviewRow> {
    const row = await this.prisma.interview.findUnique({ where: { id } });
    if (!row || row.userId !== user.id) {
      throw new NotFoundException("Interview not found");
    }
    return row;
  }
}

function toContract(row: InterviewRow): Interview {
  return {
    id: row.id,
    status: row.status,
    role: row.role ?? null,
    candidateName: row.candidateName ?? null,
    topics: (row.topics as string[]) ?? [],
    questions: (row.questions as unknown as InterviewQuestion[]) ?? [],
    answers: (row.answers as unknown as InterviewAnswer[]) ?? [],
    report: row.report ? interviewReportSchema.parse(row.report) : null,
    overallScore: row.overallScore,
    createdAt: row.createdAt.toISOString(),
    evaluatedAt: row.evaluatedAt ? row.evaluatedAt.toISOString() : null,
  };
}

/** Ground question generation in the role, the resume, and verified evidence. */
function buildGenerationPrompt(opts: {
  role: InterviewRole;
  candidateName: string;
  resumeText?: string;
  topics: InterviewTopic[];
}): string {
  const evidenceLines = opts.topics.length
    ? opts.topics.map((t) => `- ${t.theme} (proven by ${t.techs.join(", ")})`)
    : ["- (no repository evidence yet — rely on the role and resume)"];

  const resume = opts.resumeText?.trim()
    ? `\nResume / background the candidate provided:\n"""\n${opts.resumeText.trim().slice(0, 6000)}\n"""\n`
    : "\n(No resume provided.)\n";

  return [
    `You are interviewing ${opts.candidateName} for a ${ROLE_LABELS[opts.role]} role.`,
    `Focus area: ${ROLE_FOCUS[opts.role]}.`,
    "",
    "Their verified hands-on experience (from real repositories):",
    ...evidenceLines,
    resume,
    "Generate the interview as a sequence of spoken questions:",
    `- Question 1 MUST be a warm spoken intro that greets them by name and asks them to introduce themselves — e.g. "Hi ${opts.candidateName}, welcome! To start, tell me a bit about yourself and what you've been building." Set its topic to "Introduction" and difficulty to "easy".`,
    "- Then 5 more questions for the role, ordered easy → hard, grounded in the focus area, their evidence, and their resume where relevant.",
    "- Spoken software-engineering questions (concepts, design, trade-offs, experience) — NOT live coding or competitive-programming puzzles.",
    "- Keep every 'prompt' natural to say out loud (1-3 sentences).",
    "- 'rationale' is a short non-spoken note on why the question fits this candidate.",
    "- Produce 6 questions total (the intro plus 5).",
  ].join("\n");
}

/** Pair questions with the candidate's answers for grading. */
function buildEvaluationPrompt(questions: InterviewQuestion[], answers: InterviewAnswer[]): string {
  const byId = new Map(answers.map((a) => [a.questionId, a.answer]));
  const blocks = questions
    .map((q) => {
      const answer = (byId.get(q.id) ?? "").trim() || "(no answer)";
      return `[${q.id}] (${q.difficulty}, ${q.topic})\nQ: ${q.prompt}\nCandidate's answer: ${answer}`;
    })
    .join("\n\n");

  return [
    "Grade this candidate's technical interview fairly and constructively.",
    "",
    blocks,
    "",
    "For EACH question, return per-answer feedback keyed by its exact id (q1, q2, ...): a score 0-100, a one-word verdict (Strong/Solid/Partial/Weak/Missing), specific feedback, and 2-3 idealPoints a strong answer would cover.",
    "Then return an overall assessment: overallScore 0-100 (weighted toward the harder questions), a 2-3 sentence summary, a confidence 0-100 (how interview-ready they are), strengths, weaknesses, and prepTopics to study next.",
  ].join("\n");
}
