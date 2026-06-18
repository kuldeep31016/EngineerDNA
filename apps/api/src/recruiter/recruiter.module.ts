import { Module } from "@nestjs/common";
import { RecruiterController } from "./recruiter.controller";
import { RecruiterService } from "./recruiter.service";
import { EvidenceModule } from "../evidence/evidence.module";

/**
 * Recruiter Dashboard (Module 14). Searches verified public candidate profiles
 * by skill. Deterministic — reuses the public-evidence rollup from M6 and the
 * DNA scorer from M8. Never exposes private repositories.
 */
@Module({
  imports: [EvidenceModule],
  controllers: [RecruiterController],
  providers: [RecruiterService],
  exports: [RecruiterService],
})
export class RecruiterModule {}
