import { Injectable } from "@nestjs/common";
import type { User } from "@prisma/client";
import type { AskCopilotInput, CopilotAnswer } from "@engineerdna/shared";
import { copilotAnswerSchema } from "@engineerdna/shared";
import { PrismaService } from "../prisma/prisma.service";
import { EvidenceService } from "../evidence/evidence.service";
import { DnaService } from "../dna/dna.service";
import { ReputationService } from "../reputation/reputation.service";
import { AnthropicService } from "../llm/anthropic.service";
import { computeCareer } from "../career/career-advisor";

const SYSTEM = `You are a warm, direct senior engineering career mentor for a specific developer.
You have their VERIFIED engineering profile below. Answer their questions using ONLY this data — be specific and honest, cite their real numbers and skills, and never give generic advice or invent facts they don't have.
If the data is thin, say so plainly and tell them how to build more evidence. Be encouraging but truthful, like a great mentor. Keep answers focused (a few short paragraphs or tight bullets).`;

@Injectable()
export class CopilotService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly evidence: EvidenceService,
    private readonly dna: DnaService,
    private readonly reputation: ReputationService,
    private readonly anthropic: AnthropicService,
  ) {}

  /** Answer a career question grounded in the developer's verified profile. */
  async ask(user: User, input: AskCopilotInput): Promise<CopilotAnswer> {
    const [evidence, dna, reputation, repos] = await Promise.all([
      this.evidence.getDeveloperEvidence(user),
      this.dna.getDna(user),
      this.reputation.getReputation(user),
      this.prisma.repository.findMany({
        where: { account: { userId: user.id } },
        orderBy: [{ stars: "desc" }, { pushedAt: "desc" }],
        take: 8,
        select: { name: true, language: true, stars: true },
      }),
    ]);

    const career = computeCareer({ overall: dna.overall, scores: dna.scores, topStrengths: dna.topStrengths });
    const context = buildContext({ evidence, dna, reputation, career, repos, name: user.name });

    const conversation = (input.history ?? [])
      .slice(-12)
      .map((m) => `${m.role === "user" ? "Developer" : "Mentor"}: ${m.content}`)
      .join("\n");

    const prompt = [
      context,
      "",
      conversation ? `Conversation so far:\n${conversation}\n` : "",
      `Developer's question: ${input.question}`,
      "",
      "Answer as their mentor — specific and grounded in the profile above. Then suggest exactly 3 short follow-up questions they might ask next (each under 8 words).",
    ].join("\n");

    return this.anthropic.generateObject<CopilotAnswer>({
      schema: copilotAnswerSchema,
      system: SYSTEM,
      prompt,
    });
  }
}

function buildContext(opts: {
  evidence: Awaited<ReturnType<EvidenceService["getDeveloperEvidence"]>>;
  dna: Awaited<ReturnType<DnaService["getDna"]>>;
  reputation: Awaited<ReturnType<ReputationService["getReputation"]>>;
  career: ReturnType<typeof computeCareer>;
  repos: { name: string; language: string | null; stars: number }[];
  name: string | null;
}): string {
  const used = opts.evidence.items.filter((i) => i.strength === "USED");
  const skills = used.map((u) => u.technology);
  const dims = opts.dna.scores
    .filter((s) => s.level !== "No evidence")
    .map((s) => `${s.label} ${s.value}/100 (${s.level})`)
    .join("; ");
  const repos = opts.repos.map((r) => `${r.name}${r.language ? ` [${r.language}]` : ""}${r.stars ? ` ★${r.stars}` : ""}`).join(", ");

  return [
    `=== ${opts.name ?? "The developer"}'s VERIFIED engineering profile ===`,
    `Reputation: ${opts.reputation.available ? `${opts.reputation.score}/100 (${opts.reputation.tier})` : "not enough evidence yet"}.`,
    `Developer DNA: overall ${opts.dna.overall}/100. Top strengths: ${opts.dna.topStrengths.join(", ") || "none yet"}.`,
    `DNA dimensions: ${dims || "no verified dimensions yet"}.`,
    `Verified skills (actually USED in real repositories): ${skills.join(", ") || "none verified yet"}.`,
    `Career archetype: ${opts.career.archetype.title}.`,
    `Realistic roles: ${opts.career.roles.map((r) => r.title).join(", ") || "—"}.`,
    `Biggest skill gaps: ${opts.career.skillGaps.map((g) => g.label).join(", ") || "none major"}.`,
    `Recommended next project: ${opts.career.nextProject}.`,
    `Repositories: ${repos || "none connected"}.`,
    `(If a section says "none/not enough", the developer simply hasn't built that evidence yet — guide them to do so.)`,
  ].join("\n");
}
