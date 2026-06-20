import { join } from "node:path";
import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { PrismaModule } from "./prisma/prisma.module";
import { MailModule } from "./mail/mail.module";
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
import { RecruiterModule } from "./recruiter/recruiter.module";
import { TimelineModule } from "./timeline/timeline.module";
import { OssModule } from "./oss/oss.module";
import { PortfolioModule } from "./portfolio/portfolio.module";
import { ReputationModule } from "./reputation/reputation.module";
import { CopilotModule } from "./copilot/copilot.module";
import { PaymentsModule } from "./payments/payments.module";
import { JobsModule } from "./jobs/jobs.module";
import { ApplicationsModule } from "./applications/applications.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { MessagingModule } from "./messaging/messaging.module";

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
    // Baseline rate limit (per IP). Auth + LLM routes tighten this further.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    MailModule,
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
    RecruiterModule,
    TimelineModule,
    OssModule,
    PortfolioModule,
    ReputationModule,
    CopilotModule,
    PaymentsModule,
    JobsModule,
    ApplicationsModule,
    NotificationsModule,
    MessagingModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
