import { Module } from "@nestjs/common";
import { ProjectIntelligenceController } from "./project-intelligence.controller";
import { ProjectIntelligenceService } from "./project-intelligence.service";
import { EvidenceModule } from "../evidence/evidence.module";

/**
 * Project Intelligence (Module 9). Reads Module 5 analysis + Module 6 evidence
 * to produce a per-repository report card and quality score.
 */
@Module({
  imports: [EvidenceModule],
  controllers: [ProjectIntelligenceController],
  providers: [ProjectIntelligenceService],
  exports: [ProjectIntelligenceService],
})
export class ProjectIntelligenceModule {}
