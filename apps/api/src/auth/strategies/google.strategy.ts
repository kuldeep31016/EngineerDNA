import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, type Profile, type VerifyCallback } from "passport-google-oauth20";
import { AuthProvider } from "@prisma/client";
import type { OAuthProfileInput } from "../../users/users.service";

/**
 * Google OAuth. Authenticates the user only. Placeholder credentials keep the
 * app bootable before Google keys are configured.
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>("GOOGLE_CLIENT_ID") ?? "not-configured",
      clientSecret: config.get<string>("GOOGLE_CLIENT_SECRET") ?? "not-configured",
      callbackURL: `${config.get<string>("API_PUBLIC_URL") ?? "http://localhost:4000/api"}/auth/google/callback`,
      scope: ["email", "profile"],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const result: OAuthProfileInput = {
      provider: AuthProvider.GOOGLE,
      providerId: profile.id,
      email: profile.emails?.[0]?.value ?? `${profile.id}@google.local`,
      name: profile.displayName ?? null,
      profileImage: profile.photos?.[0]?.value ?? null,
    };
    done(null, result);
  }
}
