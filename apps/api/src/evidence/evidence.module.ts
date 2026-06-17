import { Module } from "@nestjs/common";
import { EvidenceController } from "./evidence.controller";
import { EvidenceService } from "./evidence.service";
import { GithubModule } from "../github/github.module";
import { AnalysisModule } from "../analysis/analysis.module";

/**
 * Evidence Engine (Module 6). The reusable "truth layer" — collects USED vs
 * MENTIONED evidence per technology. Imports GithubModule (token + API client)
 * and AnalysisModule (the repo-facts gatherer it reuses).
 */
@Module({
  imports: [GithubModule, AnalysisModule],
  controllers: [EvidenceController],
  providers: [EvidenceService],
  exports: [EvidenceService],
})
export class EvidenceModule {}
