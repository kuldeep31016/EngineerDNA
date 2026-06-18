import { join } from "node:path";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthModule } from "./health/health.module";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { ProfileModule } from "./profile/profile.module";
import { GithubModule } from "./github/github.module";
import { LlmModule } from "./llm/llm.module";
import { AnalysisModule } from "./analysis/analysis.module";
import { EvidenceModule } from "./evidence/evidence.module";
import { VerificationModule } from "./verification/verification.module";
import { DnaModule } from "./dna/dna.module";
import { ProjectIntelligenceModule } from "./project/project-intelligence.module";
import { CareerModule } from "./career/career.module";
import { InterviewModule } from "./interview/interview.module";
import { ResumeModule } from "./resume/resume.module";
import { RoadmapModule } from "./roadmap/roadmap.module";

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
    LlmModule,
    HealthModule,
    UsersModule,
    AuthModule,
    ProfileModule,
    GithubModule,
    AnalysisModule,
    EvidenceModule,
    VerificationModule,
    DnaModule,
    ProjectIntelligenceModule,
    CareerModule,
    InterviewModule,
    ResumeModule,
    RoadmapModule,
  ],
})
export class AppModule {}
