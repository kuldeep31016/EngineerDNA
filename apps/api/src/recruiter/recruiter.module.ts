import { Module } from "@nestjs/common";
import { RecruiterController } from "./recruiter.controller";
import { RecruiterService } from "./recruiter.service";
import { JobController } from "./job.controller";
import { JobService } from "./job.service";
import { RankingService } from "./ranking.service";
import { EvidenceModule } from "../evidence/evidence.module";
import { PaymentsModule } from "../payments/payments.module";
import { JobsModule } from "../jobs/jobs.module";

/**
 * Recruiter Dashboard (Module 14). Searches verified public candidate profiles
 * by skill. Deterministic — reuses the public-evidence rollup from M6 and the
 * DNA scorer from M8. Never exposes private repositories.
 */
@Module({
  imports: [EvidenceModule, PaymentsModule, JobsModule],
  controllers: [RecruiterController, JobController],
  providers: [RecruiterService, JobService, RankingService],
  exports: [RecruiterService],
})
export class RecruiterModule {}
