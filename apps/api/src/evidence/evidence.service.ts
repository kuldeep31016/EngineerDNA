import { Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma, Repository, TechEvidence, User } from "@prisma/client";
import type {
  DeveloperEvidence,
  DeveloperEvidenceItem,
  Proof,
  RepoEvidenceItem,
  TimelineEntry,
} from "@engineerdna/shared";
import { PrismaService } from "../prisma/prisma.service";
import { TokenCipherService } from "../common/security/token-cipher.service";
import { RepoFactsService } from "../analysis/repo-facts.service";
import { extractEvidence } from "./evidence-extractor";

@Injectable()
export class EvidenceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cipher: TokenCipherService,
    private readonly repoFacts: RepoFactsService,
  ) {}

  /** Run deterministic extraction for one repo and persist its evidence. */
  async extractForRepo(user: User, repoId: string): Promise<RepoEvidenceItem[]> {
    const repo = await this.requireOwnedRepo(user, repoId);
    const account = await this.prisma.githubAccount.findUniqueOrThrow({
      where: { id: repo.githubAccountId },
    });
    const token = this.cipher.decrypt(account.accessToken);
    const facts = await this.repoFacts.gather(token, repo);

    const items = extractEvidence({
      primaryLanguages: facts.primaryLanguages,
      filePaths: facts.filePaths,
      manifests: facts.manifests,
    });

    const firstSeenAt = repo.repoCreatedAt ?? repo.pushedAt ?? null;

    // Replace this repo's evidence atomically.
    await this.prisma.$transaction([
      this.prisma.techEvidence.deleteMany({ where: { repositoryId: repo.id } }),
      this.prisma.techEvidence.createMany({
        data: items.map((item) => ({
          userId: account.userId,
          repositoryId: repo.id,
          technology: item.technology,
          category: item.category,
          strength: item.strength,
          confidence: item.confidence,
          source: item.source,
          proofs: item.proofs as unknown as Prisma.InputJsonValue,
          firstSeenAt,
        })),
      }),
    ]);

    return items;
  }

  /** Extract evidence for every repository the user selected for analysis. */
  async buildForSelected(user: User): Promise<DeveloperEvidence> {
    const account = await this.prisma.githubAccount.findUnique({ where: { userId: user.id } });
    if (account) {
      const selected = await this.prisma.repository.findMany({
        where: { githubAccountId: account.id, selectedForAnalysis: true },
        select: { id: true },
      });
      for (const repo of selected) {
        await this.extractForRepo(user, repo.id);
      }
    }
    return this.getDeveloperEvidence(user);
  }

  /** Stored evidence for one repository. */
  async getRepoEvidence(user: User, repoId: string): Promise<RepoEvidenceItem[]> {
    const repo = await this.requireOwnedRepo(user, repoId);
    const rows = await this.prisma.techEvidence.findMany({
      where: { repositoryId: repo.id },
      orderBy: [{ strength: "desc" }, { technology: "asc" }],
    });
    return rows.map(EvidenceService.toRepoItem);
  }

  /** The developer's evidence rolled up across all repositories, plus timeline. */
  async getDeveloperEvidence(user: User): Promise<DeveloperEvidence> {
    const rows = await this.prisma.techEvidence.findMany({
      where: { userId: user.id },
      include: { repository: { select: { name: true } } },
    });

    const items = EvidenceService.aggregateItems(rows);

    const timeline: TimelineEntry[] = items
      .filter((i) => i.strength === "USED" && i.firstSeenAt)
      .map((i) => ({ technology: i.technology, category: i.category, firstSeenAt: i.firstSeenAt! }))
      .sort((a, b) => a.firstSeenAt.localeCompare(b.firstSeenAt));

    return { items, timeline };
  }

  /**
   * Verified evidence rolled up from a user's PUBLIC repositories only — used by
   * the recruiter view, which must never expose private repositories.
   */
  async getPublicEvidenceItems(userId: string): Promise<DeveloperEvidenceItem[]> {
    const rows = await this.prisma.techEvidence.findMany({
      where: { userId, repository: { isPrivate: false } },
      include: { repository: { select: { name: true } } },
    });
    return EvidenceService.aggregateItems(rows);
  }

  /** Roll up per-repository evidence rows into one item per technology. */
  private static aggregateItems(
    rows: (TechEvidence & { repository: { name: string } })[],
  ): DeveloperEvidenceItem[] {
    const groups = new Map<string, (TechEvidence & { repository: { name: string } })[]>();
    for (const row of rows) {
      const key = row.technology.toLowerCase();
      const arr = groups.get(key) ?? [];
      arr.push(row);
      groups.set(key, arr);
    }

    const items: DeveloperEvidenceItem[] = [...groups.values()].map((rowsForTech) => {
      const used = rowsForTech.some((r) => r.strength === "USED");
      const repositories = [...new Set(rowsForTech.map((r) => r.repository.name))];
      const proofs: Proof[] = [];
      for (const r of rowsForTech) {
        for (const p of (r.proofs as unknown as Proof[]) ?? []) {
          if (!proofs.some((x) => x.detail === p.detail)) proofs.push(p);
        }
      }
      const firstSeen = rowsForTech
        .map((r) => r.firstSeenAt)
        .filter((d): d is Date => d !== null)
        .sort((a, b) => a.getTime() - b.getTime())[0];

      return {
        technology: rowsForTech[0]!.technology,
        category: rowsForTech[0]!.category,
        strength: used ? "USED" : "MENTIONED",
        confidence: Math.max(...rowsForTech.map((r) => r.confidence)),
        repositoryCount: repositories.length,
        repositories,
        firstSeenAt: firstSeen ? firstSeen.toISOString() : null,
        proofs: proofs.slice(0, 5),
      };
    });

    items.sort((a, b) => {
      if (a.strength !== b.strength) return a.strength === "USED" ? -1 : 1;
      if (a.repositoryCount !== b.repositoryCount) return b.repositoryCount - a.repositoryCount;
      return a.technology.localeCompare(b.technology);
    });

    return items;
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

  private static toRepoItem(row: TechEvidence): RepoEvidenceItem {
    return {
      technology: row.technology,
      category: row.category,
      strength: row.strength,
      confidence: row.confidence,
      source: row.source,
      proofs: (row.proofs as unknown as Proof[]) ?? [],
    };
  }
}
