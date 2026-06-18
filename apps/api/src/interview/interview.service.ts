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
  type StartInterviewResult,
  type SubmitAnswersInput,
} from "@engineerdna/shared";
import { PrismaService } from "../prisma/prisma.service";
import { EvidenceService } from "../evidence/evidence.service";
import { AnthropicService } from "../llm/anthropic.service";
import { selectInterviewTopics, type InterviewTopic } from "./interview-topics";

const GEN_SYSTEM = `You are a principal software engineer designing a fair, personalized technical interview from a candidate's VERIFIED engineering evidence.
Ground every question in what they have actually built — never invent experience they don't have.
These are software-engineering interviews: system design, trade-offs, debugging, real implementation — NOT competitive-programming puzzles.`;

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
   * Generate a personalized interview from the developer's evidence. One LLM
   * call (batched) keeps cost to a single request per interview.
   */
  async startInterview(user: User): Promise<StartInterviewResult> {
    const evidence = await this.evidence.getDeveloperEvidence(user);
    const topics = selectInterviewTopics(evidence.items);
    if (topics.length === 0) {
      return {
        available: false,
        reason:
          "Build evidence from your repositories first — your interview is generated from technologies you've actually used.",
        interview: null,
      };
    }

    const generated = await this.anthropic.generateObject({
      schema: generatedQuestionsSchema,
      system: GEN_SYSTEM,
      prompt: buildGenerationPrompt(topics),
    });

    const questions: InterviewQuestion[] = generated.questions.map((q, i) => ({
      id: `q${i + 1}`,
      ...q,
    }));

    const row = await this.prisma.interview.create({
      data: {
        userId: user.id,
        status: "GENERATED",
        topics: topics.map((t) => t.theme),
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
    topics: (row.topics as string[]) ?? [],
    questions: (row.questions as unknown as InterviewQuestion[]) ?? [],
    answers: (row.answers as unknown as InterviewAnswer[]) ?? [],
    report: row.report ? interviewReportSchema.parse(row.report) : null,
    overallScore: row.overallScore,
    createdAt: row.createdAt.toISOString(),
    evaluatedAt: row.evaluatedAt ? row.evaluatedAt.toISOString() : null,
  };
}

/** Ground the question generation in the candidate's evidence-backed topics. */
function buildGenerationPrompt(topics: InterviewTopic[]): string {
  const lines = topics.map((t, i) => {
    const repos = t.repos.slice(0, 4).join(", ");
    return `${i + 1}. ${t.theme} — proven by ${t.techs.join(", ")} (in ${t.repos.length} repo${
      t.repos.length === 1 ? "" : "s"
    }: ${repos})`;
  });

  return [
    "Generate a personalized technical interview for this candidate.",
    "They have VERIFIED, hands-on experience in these areas (each backed by their real repositories):",
    "",
    ...lines,
    "",
    "Rules:",
    "- Produce exactly 5 questions, ordered from easier to harder (build up difficulty).",
    "- Each question must be grounded in ONE of the areas above and reflect the kind of work they've done.",
    "- Software-engineering questions only (design, trade-offs, debugging, implementation) — no competitive-programming puzzles.",
    "- 'rationale' explains in one sentence why this question is fair given their evidence.",
    "- Keep each 'prompt' to 2-4 sentences.",
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
