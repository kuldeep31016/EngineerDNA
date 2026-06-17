import { Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import type { Request, Response } from "express";
import type { User } from "@prisma/client";
import type { AuthAck, MeResponse } from "@engineerdna/shared";
import { AuthService } from "./auth.service";
import { UsersService, type OAuthProfileInput } from "../users/users.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { CurrentUser } from "./decorators/current-user.decorator";
import { REFRESH_TOKEN_COOKIE } from "./auth.constants";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  // ---- GitHub OAuth ----

  /** GET /api/auth/github — redirects to GitHub's consent screen. */
  @Get("github")
  @UseGuards(AuthGuard("github"))
  githubLogin(): void {
    // Passport handles the redirect.
  }

  /** GET /api/auth/github/callback — completes login, sets cookies, redirects. */
  @Get("github/callback")
  @UseGuards(AuthGuard("github"))
  async githubCallback(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.completeOAuth(req.user as OAuthProfileInput, res);
  }

  // ---- Google OAuth ----

  @Get("google")
  @UseGuards(AuthGuard("google"))
  googleLogin(): void {
    // Passport handles the redirect.
  }

  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  async googleCallback(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.completeOAuth(req.user as OAuthProfileInput, res);
  }

  // ---- Session lifecycle ----

  /** POST /api/auth/refresh — rotate the refresh token, mint a new session. */
  @Post("refresh")
  async refresh(@Req() req: Request, @Res() res: Response): Promise<void> {
    const raw = this.readRefreshCookie(req);
    await this.authService.rotateRefreshToken(raw, res);
    const body: AuthAck = { success: true };
    res.json(body);
  }

  /** POST /api/auth/logout — revoke the refresh token and clear cookies. */
  @Post("logout")
  async logout(@Req() req: Request, @Res() res: Response): Promise<void> {
    const raw = this.readRefreshCookie(req);
    await this.authService.logout(raw, res);
    const body: AuthAck = { success: true };
    res.json(body);
  }

  /** GET /api/auth/me — the current authenticated user. */
  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: User): MeResponse {
    return { user: UsersService.toAuthUser(user) };
  }

  // ---- helpers ----

  private async completeOAuth(profile: OAuthProfileInput, res: Response): Promise<void> {
    const user = await this.authService.loginWithOAuth(profile);
    await this.authService.issueSession(user, res);
    const webOrigin = this.config.get<string>("WEB_ORIGIN") ?? "http://localhost:3000";
    res.redirect(`${webOrigin}/dashboard`);
  }

  private readRefreshCookie(req: Request): string | undefined {
    const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
    return cookies?.[REFRESH_TOKEN_COOKIE];
  }
}
