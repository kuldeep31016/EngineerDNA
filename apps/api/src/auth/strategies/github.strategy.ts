import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, type Profile } from "passport-github2";
import { AuthProvider } from "@prisma/client";
import type { OAuthProfileInput } from "../../users/users.service";

/**
 * GitHub OAuth. Authenticates the user only — repository access is a later
 * module. Falls back to placeholder credentials so the app still boots when
 * GitHub keys aren't configured yet (the route will simply fail until set).
 */
@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, "github") {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>("GITHUB_CLIENT_ID") ?? "not-configured",
      clientSecret: config.get<string>("GITHUB_CLIENT_SECRET") ?? "not-configured",
      callbackURL: `${config.get<string>("API_PUBLIC_URL") ?? "http://localhost:4000/api"}/auth/github/callback`,
      scope: ["user:email"],
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile): OAuthProfileInput {
    const email =
      profile.emails?.[0]?.value ?? `${profile.username ?? profile.id}@users.noreply.github.com`;
    return {
      provider: AuthProvider.GITHUB,
      providerId: profile.id,
      email,
      name: profile.displayName ?? profile.username ?? null,
      profileImage: profile.photos?.[0]?.value ?? null,
    };
  }
}
