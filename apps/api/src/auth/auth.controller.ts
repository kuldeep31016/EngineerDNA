import { Body, Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import type { Request, Response } from "express";
import type { User } from "@prisma/client";
import {
  recruiterLoginRequestSchema,
  recruiterSignupRequestSchema,
  type AuthAck,
  type MeResponse,
  type RecruiterLoginInput,
  type RecruiterSignupInput,
} from "@engineerdna/shared";
import { AuthService } from "./auth.service";
import { UsersService, type OAuthProfileInput } from "../users/users.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { CurrentUser } from "./decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { REFRESH_TOKEN_COOKIE } from "./auth.constants";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly users: UsersService,
    private readonly config: ConfigService,
  ) {}

  // ---- Recruiter credentials auth ----

  /** POST /api/auth/recruiter/signup — register a recruiter, set session. */
  @Post("recruiter/signup")
  async recruiterSignup(
    @Body(new ZodValidationPipe(recruiterSignupRequestSchema)) body: RecruiterSignupInput,
    @Res() res: Response,
  ): Promise<void> {
    const user = await this.authService.recruiterSignup(body);
    await this.authService.issueSession(user, res);
    const payload: MeResponse = { user: UsersService.toAuthUser(user, body.companyName) };
    res.json(payload);
  }

  /** POST /api/auth/recruiter/login — verify credentials, set session. */
  @Post("recruiter/login")
  async recruiterLogin(
    @Body(new ZodValidationPipe(recruiterLoginRequestSchema)) body: RecruiterLoginInput,
    @Res() res: Response,
  ): Promise<void> {
    const user = await this.authService.recruiterLogin(body);
    await this.authService.issueSession(user, res);
    const companyName = await this.users.findCompanyName(user.id);
    const payload: MeResponse = { user: UsersService.toAuthUser(user, companyName) };
    res.json(payload);
  }

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
  async me(@CurrentUser() user: User): Promise<MeResponse> {
    const companyName = user.role === "RECRUITER" ? await this.users.findCompanyName(user.id) : null;
    return { user: UsersService.toAuthUser(user, companyName) };
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
