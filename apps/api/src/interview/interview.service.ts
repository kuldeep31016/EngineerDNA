import { Injectable, NotFoundException } from "@nestjs/common";
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
  type InterviewTurnResult,
  type StartInterviewInput,
  type StartInterviewResult,
} from "@engineerdna/shared";
import { PrismaService } from "../prisma/prisma.service";
import { EvidenceService } from "../evidence/evidence.service";
import { AnthropicService } from "../llm/anthropic.service";
import { selectInterviewTopics, type InterviewTopic } from "./interview-topics";

/** Total questions per interview (the intro plus follow-ups). Kept short. */
const TARGET_QUESTIONS = 6;

const NEXT_SYSTEM = `You are a friendly but rigorous technical interviewer running a live, spoken mock interview.
You ask ONE question at a time and adapt to the candidate's previous answers — like a real interviewer.
Prefer natural follow-ups that go deeper on what they just said; move to a new area when a thread is exhausted or an answer was weak.
Ground questions in the candidate's role, resume, and verified evidence — never invent experience. Spoken, conversational questions only — NEVER competitive-programming puzzles.`;

const EVAL_SYSTEM = `You are an experienced, fair technical interviewer grading a candidate's answers.
Score strictly but constructively, based ONLY on what the candidate actually said. Reward correct engineering reasoning even when phrased simply; penalize vague, wrong, or missing answers.
Return feedback for EVERY question id provided.`;

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

// The model returns a single next question; the id is assigned by us.
const nextQuestionSchema = z.object({
  topic: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  prompt: z.string(),
  rationale: z.string(),
});

@Injectable()
export class InterviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly evidence: EvidenceService,
    private readonly anthropic: AnthropicService,
  ) {}

  /**
   * Begin an interview. The opening question is deterministic (no LLM cost);
   * follow-ups are generated one turn at a time. Connecting a repo is optional —
   * evidence only sharpens the questions when present.
   */
  async startInterview(user: User, input: StartInterviewInput): Promise<StartInterviewResult> {
    const candidateName = input.candidateName?.trim() || user.name || "there";
    const evidence = await this.evidence.getDeveloperEvidence(user);
    const topics = selectInterviewTopics(evidence.items);

    const intro: InterviewQuestion = {
      id: "q1",
      topic: "Introduction",
      difficulty: "easy",
      prompt: `Hi ${candidateName}, welcome! To start, tell me a bit about yourself and what you've been building.`,
      rationale: "Warm-up introduction.",
    };

    const displayTopics = topics.length ? topics.map((t) => t.theme) : [ROLE_LABELS[input.role]];

    const row = await this.prisma.interview.create({
      data: {
        userId: user.id,
        status: "GENERATED",
        role: input.role,
        candidateName: input.candidateName?.trim() || user.name || null,
        resumeText: input.resumeText?.trim() || null,
        topics: displayTopics,
        questions: [intro] as unknown as Prisma.InputJsonValue,
        answers: [],
        model: this.anthropic.model,
      },
    });

    return { available: true, reason: null, interview: toContract(row) };
  }

  /**
   * Record the answer to the current question and, unless the interview is over,
   * generate the next (adaptive) question. Uses the cheap fast model per turn.
   */
  async submitTurn(user: User, id: string, answer: string): Promise<InterviewTurnResult> {
    const row = await this.requireOwned(user, id);
    if (row.status === "EVALUATED") {
      return { interview: toContract(row), done: true };
    }

    const questions = (row.questions as unknown as InterviewQuestion[]) ?? [];
    const answers = (row.answers as unknown as InterviewAnswer[]) ?? [];
    const current = questions[questions.length - 1];

    // Store/replace the answer to the question currently on screen.
    if (current) {
      const next = answers.filter((a) => a.questionId !== current.id);
      next.push({ questionId: current.id, answer });
      answers.length = 0;
      answers.push(...next);
    }

    // Interview complete once we've reached the target number of questions.
    if (questions.length >= TARGET_QUESTIONS) {
      const updated = await this.prisma.interview.update({
        where: { id: row.id },
        data: { answers: answers as unknown as Prisma.InputJsonValue },
      });
      return { interview: toContract(updated), done: true };
    }

    const evidence = await this.evidence.getDeveloperEvidence(user);
    const topics = selectInterviewTopics(evidence.items);
    const generated = await this.anthropic.generateObject({
      schema: nextQuestionSchema,
      system: NEXT_SYSTEM,
      model: this.anthropic.fastModel,
      maxTokens: 1024,
      prompt: buildNextQuestionPrompt({
        role: (row.role as InterviewRole) ?? "backend",
        resumeText: row.resumeText ?? undefined,
        topics,
        transcript: questions.map((q) => ({ q, a: answers.find((a) => a.questionId === q.id)?.answer ?? "" })),
        nextNumber: questions.length + 1,
        total: TARGET_QUESTIONS,
      }),
    });

    questions.push({ id: `q${questions.length + 1}`, ...generated });

    const updated = await this.prisma.interview.update({
      where: { id: row.id },
      data: {
        questions: questions as unknown as Prisma.InputJsonValue,
        answers: answers as unknown as Prisma.InputJsonValue,
      },
    });
    return { interview: toContract(updated), done: false };
  }

  /** Grade the full conversation in one call and store the report. */
  async gradeInterview(user: User, id: string): Promise<Interview> {
    const row = await this.requireOwned(user, id);
    if (row.status === "EVALUATED") return toContract(row);

    const questions = (row.questions as unknown as InterviewQuestion[]) ?? [];
    const answers = (row.answers as unknown as InterviewAnswer[]) ?? [];

    const report = await this.anthropic.generateObject<InterviewReport>({
      schema: interviewReportSchema,
      system: EVAL_SYSTEM,
      prompt: buildEvaluationPrompt(questions, answers),
    });

    const updated = await this.prisma.interview.update({
      where: { id: row.id },
      data: {
        status: "EVALUATED",
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

/** Build the prompt for the next adaptive question from the conversation. */
function buildNextQuestionPrompt(opts: {
  role: InterviewRole;
  resumeText?: string;
  topics: InterviewTopic[];
  transcript: { q: InterviewQuestion; a: string }[];
  nextNumber: number;
  total: number;
}): string {
  const evidenceLines = opts.topics.length
    ? opts.topics.map((t) => `- ${t.theme} (proven by ${t.techs.join(", ")})`)
    : ["- (no connected repositories — rely on the role and resume)"];

  const resume = opts.resumeText?.trim()
    ? `\nCandidate resume / background:\n"""\n${opts.resumeText.trim().slice(0, 4000)}\n"""\n`
    : "\n(No resume provided.)\n";

  const conversation = opts.transcript
    .map(({ q, a }) => `Interviewer: ${q.prompt}\nCandidate: ${a.trim() || "(no answer)"}`)
    .join("\n\n");

  return [
    `Role: ${ROLE_LABELS[opts.role]}. Focus area: ${ROLE_FOCUS[opts.role]}.`,
    "",
    "Candidate's verified hands-on experience:",
    ...evidenceLines,
    resume,
    "Conversation so far:",
    conversation,
    "",
    `This is question ${opts.nextNumber} of ${opts.total}. Ask the NEXT single spoken question.`,
    "- Prefer a natural follow-up that digs into their last answer (go deeper, ask for a concrete example, or pose an edge case).",
    "- If the last answer was empty or weak, gently move to another important area for the role.",
    "- Escalate difficulty as the interview progresses.",
    "- Keep the 'prompt' natural to say out loud (1-2 sentences). 'rationale' is a short non-spoken note.",
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
