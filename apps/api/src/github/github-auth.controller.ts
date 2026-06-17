import { Controller, Get, Query, Req, Res, UseGuards } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { Request, Response } from "express";
import type { User } from "@prisma/client";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { GithubApiService } from "./github-api.service";
import { GithubService } from "./github.service";

/**
 * The "Connect GitHub" OAuth flow — separate from login (M2). It requests the
 * `repo` scope so the user can grant repository access (including private).
 * A short-lived signed `state` ties the callback back to the logged-in user.
 */
@Controller("auth/github")
export class GithubAuthController {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly githubApi: GithubApiService,
    private readonly githubService: GithubService,
  ) {}

  /** GET /api/auth/github/connect — begin GitHub repo authorization. */
  @Get("connect")
  @UseGuards(JwtAuthGuard)
  async connect(@CurrentUser() user: User, @Res() res: Response): Promise<void> {
    const state = await this.jwt.signAsync(
      { sub: user.id, t: "gh-connect" },
      { secret: this.secret(), expiresIn: "10m" },
    );
    const params = new URLSearchParams({
      client_id: this.config.get<string>("GITHUB_CLIENT_ID") ?? "",
      redirect_uri: `${this.apiUrl()}/auth/github/connect/callback`,
      scope: "read:user repo",
      state,
      allow_signup: "false",
    });
    res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
  }

  /** GET /api/auth/github/connect/callback — exchange code, store, redirect. */
  @Get("connect/callback")
  async callback(
    @Query("code") code: string | undefined,
    @Query("state") state: string | undefined,
    @Req() _req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const web = this.config.get<string>("WEB_ORIGIN") ?? "http://localhost:3000";

    let userId: string;
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; t: string }>(state ?? "", {
        secret: this.secret(),
      });
      if (payload.t !== "gh-connect") throw new Error("bad state");
      userId = payload.sub;
    } catch {
      res.redirect(`${web}/repositories?error=state`);
      return;
    }

    if (!code) {
      res.redirect(`${web}/repositories?error=denied`);
      return;
    }

    try {
      const { accessToken, scope } = await this.githubApi.exchangeCodeForToken(code);
      await this.githubService.connect(userId, accessToken, scope);
      res.redirect(`${web}/repositories?connected=1`);
    } catch {
      res.redirect(`${web}/repositories?error=connect`);
    }
  }

  private secret(): string {
    return this.config.get<string>("JWT_SECRET") ?? "dev-insecure-secret";
  }

  private apiUrl(): string {
    return this.config.get<string>("API_PUBLIC_URL") ?? "http://localhost:4000/api";
  }
}
