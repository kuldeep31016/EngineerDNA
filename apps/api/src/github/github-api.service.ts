import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/** A single repository as returned by the GitHub REST API (fields we use). */
export interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  private: boolean;
  html_url: string;
  default_branch: string | null;
  pushed_at: string | null;
}

interface GithubUser {
  id: number;
  login: string;
}

/**
 * Thin client over the GitHub REST API. Uses fetch (Node 20) — no SDK, to keep
 * dependencies minimal. Only the calls Module 4 needs: token exchange, identity,
 * and listing the authenticated user's repositories.
 */
@Injectable()
export class GithubApiService {
  private readonly logger = new Logger(GithubApiService.name);
  private readonly api = "https://api.github.com";

  constructor(private readonly config: ConfigService) {}

  /** Exchange an OAuth code for an access token. */
  async exchangeCodeForToken(code: string): Promise<{ accessToken: string; scope: string }> {
    const res = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: this.config.get<string>("GITHUB_CLIENT_ID"),
        client_secret: this.config.get<string>("GITHUB_CLIENT_SECRET"),
        code,
      }),
    });
    const data = (await res.json()) as { access_token?: string; scope?: string; error?: string };
    if (!data.access_token) {
      this.logger.error(`Token exchange failed: ${data.error ?? "unknown"}`);
      throw new InternalServerErrorException("Failed to connect GitHub");
    }
    return { accessToken: data.access_token, scope: data.scope ?? "" };
  }

  /** The GitHub identity behind a token. */
  async getAuthenticatedUser(token: string): Promise<GithubUser> {
    const res = await fetch(`${this.api}/user`, { headers: this.headers(token) });
    if (!res.ok) throw new InternalServerErrorException("Failed to read GitHub profile");
    return (await res.json()) as GithubUser;
  }

  /** All repositories the user owns (paginated; private included if scoped). */
  async listRepositories(token: string): Promise<GithubRepo[]> {
    const all: GithubRepo[] = [];
    const perPage = 100;
    for (let page = 1; page <= 10; page += 1) {
      const url = `${this.api}/user/repos?per_page=${perPage}&page=${page}&affiliation=owner&sort=updated`;
      const res = await fetch(url, { headers: this.headers(token) });
      if (!res.ok) throw new InternalServerErrorException("Failed to list repositories");
      const batch = (await res.json()) as GithubRepo[];
      all.push(...batch);
      if (batch.length < perPage) break;
    }
    return all;
  }

  private headers(token: string): Record<string, string> {
    return {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
  }
}
