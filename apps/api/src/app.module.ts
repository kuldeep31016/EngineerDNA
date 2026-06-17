import { join } from "node:path";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthModule } from "./health/health.module";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { ProfileModule } from "./profile/profile.module";
import { GithubModule } from "./github/github.module";

/**
 * Root module. Feature modules (profile, github, evidence, ...) will be
 * registered here as they are built — each one independently replaceable.
 */
@Module({
  imports: [
    // Loads the single monorepo-root .env whether the API runs from the repo
    // root (Docker) or from apps/api (local `pnpm dev`).
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(process.cwd(), ".env"), join(process.cwd(), "..", "..", ".env")],
    }),
    PrismaModule,
    HealthModule,
    UsersModule,
    AuthModule,
    ProfileModule,
    GithubModule,
  ],
})
export class AppModule {}
