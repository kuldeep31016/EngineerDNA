import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import type { Prisma, RepositoryAnalysis as AnalysisRow, Repository, User } from "@prisma/client";
import {
  analysisReportSchema,
  type AnalysisReport,
  type RepositoryAnalysis,
} from "@engineerdna/shared";
import { PrismaService } from "../prisma/prisma.service";
import { TokenCipherService } from "../common/security/token-cipher.service";
import { AnthropicService } from "../llm/anthropic.service";
import { RepoFactsService, type RepoFacts } from "./repo-facts.service";

const SYSTEM_PROMPT = `You are a principal software engineer writing an engineering report about a GitHub repository for a college student.
Explain things clearly and simply, without jargon the student wouldn't know. Be honest and specific.
Base every statement ONLY on the provided repository facts (file paths, manifest files, README). Do not invent technologies that aren't evidenced.
If something isn't present (e.g. no tests, no deployment config), say so plainly rather than guessing.`;

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cipher: TokenCipherService,
    private readonly anthropic: AnthropicService,
    private readonly repoFacts: RepoFactsService,
  ) {}

  /** Current analysis for a repo the caller owns (or null if never run). */
  async getAnalysis(user: User, repoId: string): Promise<RepositoryAnalysis | null> {
    const repo = await this.requireOwnedRepo(user, repoId);
    const row = await this.prisma.repositoryAnalysis.findUnique({
      where: { repositoryId: repo.id },
    });
    return row ? AnalysisService.toContract(row) : null;
  }

  /** Kick off (or re-run) analysis. Returns immediately; work runs in background. */
  async startAnalysis(user: User, repoId: string): Promise<RepositoryAnalysis> {
    const repo = await this.requireOwnedRepo(user, repoId);

    // Cost guard: reuse a still-valid report instead of paying for the LLM again.
    // A report is still valid if it succeeded, used the current model, and the
    // repository hasn't been pushed to since it was generated.
    const existing = await this.prisma.repositoryAnalysis.findUnique({
      where: { repositoryId: repo.id },
    });
    if (
      existing &&
      existing.status === "COMPLETED" &&
      existing.model === this.anthropic.model &&
      AnalysisService.isUpToDate(repo, existing)
    ) {
      return AnalysisService.toContract(existing);
    }

    const row = await this.prisma.repositoryAnalysis.upsert({
      where: { repositoryId: repo.id },
      create: { repositoryId: repo.id, status: "RUNNING", model: this.anthropic.model },
      update: { status: "RUNNING", error: null, model: this.anthropic.model },
    });

    // Fire-and-forget. (A real queue/worker — BullMQ — is the scale-up path.)
    void this.runAnalysis(user.id, repo).catch((err) =>
      this.logger.error(`Analysis crashed for ${repo.fullName}`, err as Error),
    );

    return AnalysisService.toContract(row);
  }

  private async runAnalysis(userId: string, repo: Repository): Promise<void> {
    try {
      const account = await this.prisma.githubAccount.findUnique({ where: { userId } });
      if (!account) throw new Error("GitHub is not connected");

      const token = this.cipher.decrypt(account.accessToken);
      const facts = await this.repoFacts.gather(token, repo);
      const report = await this.anthropic.generateObject<AnalysisReport>({
        schema: analysisReportSchema,
        system: SYSTEM_PROMPT,
        prompt: buildPrompt(facts),
      });

      await this.prisma.repositoryAnalysis.update({
        where: { repositoryId: repo.id },
        data: {
          status: "COMPLETED",
          error: null,
          report: report as unknown as Prisma.InputJsonValue,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      this.logger.error(`Analysis failed for ${repo.fullName}: ${message}`);
      await this.prisma.repositoryAnalysis.update({
        where: { repositoryId: repo.id },
        data: { status: "FAILED", error: message.slice(0, 500) },
      });
    }
  }

  private async requireOwnedRepo(user: User, repoId: string): Promise<Repository> {
    const repo = await this.prisma.repository.findUnique({
      where: { id: repoId },
      include: { account: true },
    });
    if (!repo || repo.account.userId !== user.id) {
      throw new NotFoundException("Repository not found");
    }
    return repo;
  }

  /** True if the report still reflects the repository's latest push. */
  private static isUpToDate(repo: Repository, analysis: AnalysisRow): boolean {
    if (!repo.pushedAt) return true; // no push info — treat the report as current
    return repo.pushedAt.getTime() <= analysis.updatedAt.getTime();
  }

  private static toContract(row: AnalysisRow): RepositoryAnalysis {
    return {
      repositoryId: row.repositoryId,
      status: row.status,
      report: row.report ? analysisReportSchema.parse(row.report) : null,
      model: row.model,
      error: row.error,
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}

/** Serialize repo facts into a compact prompt the model can reason over. */
function buildPrompt(facts: RepoFacts): string {
  const manifests = facts.manifests
    .map((m) => `--- ${m.path} ---\n${m.content}`)
    .join("\n\n");

  return [
    `Repository: ${facts.fullName}`,
    `Description: ${facts.description ?? "(none)"}`,
    `Visibility: ${facts.isPrivate ? "private" : "public"} · Stars: ${facts.stars} · Forks: ${facts.forks}`,
    `GitHub-detected languages: ${facts.primaryLanguages.join(", ") || "(none)"}`,
    "",
    `File paths (up to ${facts.filePaths.length}):`,
    facts.filePaths.join("\n") || "(empty repository)",
    "",
    facts.readme ? `README:\n${facts.readme}` : "README: (none)",
    "",
    manifests ? `Manifest / config files:\n${manifests}` : "Manifest files: (none found)",
    "",
    "Write the engineering report based strictly on the above.",
  ].join("\n");
}
