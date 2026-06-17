import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { createHash, randomBytes } from "node:crypto";
import type { Response } from "express";
import type { User } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { UsersService, type OAuthProfileInput } from "../users/users.service";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  type JwtPayload,
} from "./auth.constants";

const ACCESS_TTL_MS = 15 * 60 * 1000; // 15 minutes
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /** First login creates the account; every login refreshes profile + lastLogin. */
  loginWithOAuth(profile: OAuthProfileInput): Promise<User> {
    return this.users.upsertFromOAuth(profile);
  }

  /** Issue a fresh access JWT + a rotated refresh token, and set both cookies. */
  async issueSession(user: User, res: Response): Promise<void> {
    const accessToken = await this.signAccessToken(user);
    const refreshToken = await this.createRefreshToken(user.id);
    this.setAuthCookies(res, accessToken, refreshToken);
  }

  /**
   * Validate the presented refresh token, rotate it (single-use), and issue a
   * new session. Throws if the token is unknown, expired, or reused.
   */
  async rotateRefreshToken(rawToken: string | undefined, res: Response): Promise<User> {
    if (!rawToken) {
      throw new UnauthorizedException("Missing refresh token");
    }
    const tokenHash = AuthService.hashToken(rawToken);
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!existing || existing.expiresAt.getTime() < Date.now()) {
      // Unknown/expired: clear cookies defensively.
      if (existing) {
        await this.prisma.refreshToken.delete({ where: { id: existing.id } });
      }
      this.clearAuthCookies(res);
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    // Rotation: consume the used token before issuing a new one.
    await this.prisma.refreshToken.delete({ where: { id: existing.id } });
    await this.issueSession(existing.user, res);
    return existing.user;
  }

  /** Revoke the current refresh token and clear cookies. */
  async logout(rawToken: string | undefined, res: Response): Promise<void> {
    if (rawToken) {
      const tokenHash = AuthService.hashToken(rawToken);
      await this.prisma.refreshToken.deleteMany({ where: { tokenHash } });
    }
    this.clearAuthCookies(res);
  }

  private signAccessToken(user: User): Promise<string> {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    return this.jwt.signAsync(payload, {
      secret: this.config.get<string>("JWT_SECRET") ?? "dev-insecure-secret",
      expiresIn: "15m",
    });
  }

  private async createRefreshToken(userId: string): Promise<string> {
    const raw = randomBytes(48).toString("hex");
    await this.prisma.refreshToken.create({
      data: {
        tokenHash: AuthService.hashToken(raw),
        userId,
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      },
    });
    return raw;
  }

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
    const secure = this.config.get<string>("NODE_ENV") === "production";
    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      maxAge: ACCESS_TTL_MS,
      path: "/",
    });
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      maxAge: REFRESH_TTL_MS,
      path: "/",
    });
  }

  private clearAuthCookies(res: Response): void {
    res.clearCookie(ACCESS_TOKEN_COOKIE, { path: "/" });
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: "/" });
  }

  /** Opaque refresh tokens are stored only as a SHA-256 hash. */
  static hashToken(raw: string): string {
    return createHash("sha256").update(raw).digest("hex");
  }
}
