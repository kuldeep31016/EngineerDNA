import { Injectable, NotFoundException } from "@nestjs/common";
import type { Repository as RepoRow, User } from "@prisma/client";
import type { GithubStatus, Repository } from "@engineerdna/shared";
import { PrismaService } from "../prisma/prisma.service";
import { TokenCipherService } from "../common/security/token-cipher.service";
import { GithubApiService } from "./github-api.service";

@Injectable()
export class GithubService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cipher: TokenCipherService,
    private readonly github: GithubApiService,
  ) {}

  /** Store (or refresh) the connection after a successful OAuth consent. */
  async connect(userId: string, accessToken: string, scope: string): Promise<void> {
    const ghUser = await this.github.getAuthenticatedUser(accessToken);
    const encrypted = this.cipher.encrypt(accessToken);
    await this.prisma.githubAccount.upsert({
      where: { userId },
      create: {
        userId,
        githubUserId: String(ghUser.id),
        githubLogin: ghUser.login,
        accessToken: encrypted,
        scope,
      },
      update: {
        githubUserId: String(ghUser.id),
        githubLogin: ghUser.login,
        accessToken: encrypted,
        scope,
      },
    });
  }

  async getStatus(user: User): Promise<GithubStatus> {
    const account = await this.prisma.githubAccount.findUnique({
      where: { userId: user.id },
      include: { _count: { select: { repositories: true } } },
    });
    if (!account) {
      return { connected: false, githubLogin: null, repositoryCount: 0, selectedCount: 0 };
    }
    const selectedCount = await this.prisma.repository.count({
      where: { githubAccountId: account.id, selectedForAnalysis: true },
    });
    return {
      connected: true,
      githubLogin: account.githubLogin,
      repositoryCount: account._count.repositories,
      selectedCount,
    };
  }

  /** Import the user's repositories from GitHub, preserving prior selections. */
  async sync(user: User): Promise<Repository[]> {
    const account = await this.requireAccount(user.id);
    const token = this.cipher.decrypt(account.accessToken);
    const repos = await this.github.listRepositories(token);

    await this.prisma.$transaction(
      repos.map((r) =>
        this.prisma.repository.upsert({
          where: {
            githubAccountId_githubId: {
              githubAccountId: account.id,
              githubId: String(r.id),
            },
          },
          create: {
            githubAccountId: account.id,
            githubId: String(r.id),
            name: r.name,
            fullName: r.full_name,
            description: r.description,
            language: r.language,
            stars: r.stargazers_count,
            forks: r.forks_count,
            isPrivate: r.private,
            htmlUrl: r.html_url,
            defaultBranch: r.default_branch,
            pushedAt: r.pushed_at ? new Date(r.pushed_at) : null,
            repoCreatedAt: r.created_at ? new Date(r.created_at) : null,
          },
          update: {
            name: r.name,
            fullName: r.full_name,
            description: r.description,
            language: r.language,
            stars: r.stargazers_count,
            forks: r.forks_count,
            isPrivate: r.private,
            pushedAt: r.pushed_at ? new Date(r.pushed_at) : null,
            repoCreatedAt: r.created_at ? new Date(r.created_at) : null,
          },
        }),
      ),
    );

    return this.listRepositories(user);
  }

  async listRepositories(user: User): Promise<Repository[]> {
    const account = await this.prisma.githubAccount.findUnique({ where: { userId: user.id } });
    if (!account) return [];
    const rows = await this.prisma.repository.findMany({
      where: { githubAccountId: account.id },
      orderBy: { pushedAt: "desc" },
    });
    return rows.map(GithubService.toContract);
  }

  /** A single imported repository the caller owns. */
  async getRepository(user: User, repoId: string): Promise<Repository> {
    const account = await this.requireAccount(user.id);
    const repo = await this.prisma.repository.findUnique({ where: { id: repoId } });
    if (!repo || repo.githubAccountId !== account.id) {
      throw new NotFoundException("Repository not found");
    }
    return GithubService.toContract(repo);
  }

  async setSelection(user: User, repoId: string, selected: boolean): Promise<Repository> {
    const account = await this.requireAccount(user.id);
    const repo = await this.prisma.repository.findUnique({ where: { id: repoId } });
    if (!repo || repo.githubAccountId !== account.id) {
      throw new NotFoundException("Repository not found");
    }
    const updated = await this.prisma.repository.update({
      where: { id: repoId },
      data: { selectedForAnalysis: selected },
    });
    return GithubService.toContract(updated);
  }

  /** Disconnect GitHub: removes the token and all imported repositories. */
  async disconnect(user: User): Promise<void> {
    await this.prisma.githubAccount.deleteMany({ where: { userId: user.id } });
  }

  private async requireAccount(userId: string) {
    const account = await this.prisma.githubAccount.findUnique({ where: { userId } });
    if (!account) throw new NotFoundException("GitHub is not connected");
    return account;
  }

  private static toContract(row: RepoRow): Repository {
    return {
      id: row.id,
      githubId: row.githubId,
      name: row.name,
      fullName: row.fullName,
      description: row.description,
      language: row.language,
      stars: row.stars,
      forks: row.forks,
      isPrivate: row.isPrivate,
      htmlUrl: row.htmlUrl,
      pushedAt: row.pushedAt ? row.pushedAt.toISOString() : null,
      selectedForAnalysis: row.selectedForAnalysis,
    };
  }
}
