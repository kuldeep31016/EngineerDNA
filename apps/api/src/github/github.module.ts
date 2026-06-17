import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { GithubController } from "./github.controller";
import { GithubAuthController } from "./github-auth.controller";
import { GithubService } from "./github.service";
import { GithubApiService } from "./github-api.service";
import { TokenCipherService } from "../common/security/token-cipher.service";

/**
 * GitHub integration: connect an account and import repositories. JwtModule is
 * used to sign/verify the short-lived OAuth `state` token.
 */
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_SECRET") ?? "dev-insecure-secret",
      }),
    }),
  ],
  controllers: [GithubAuthController, GithubController],
  providers: [GithubService, GithubApiService, TokenCipherService],
  exports: [GithubService],
})
export class GithubModule {}
