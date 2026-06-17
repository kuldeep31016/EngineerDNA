import { Module } from "@nestjs/common";
import { AnalysisController } from "./analysis.controller";
import { AnalysisService } from "./analysis.service";
import { RepoFactsService } from "./repo-facts.service";
import { GithubModule } from "../github/github.module";

/**
 * Repository Analysis Engine (Module 5). Generates an engineering report for a
 * repository from its facts using the LLM. Imports GithubModule for the API
 * client used to gather those facts.
 */
@Module({
  imports: [GithubModule],
  controllers: [AnalysisController],
  providers: [AnalysisService, RepoFactsService],
  exports: [AnalysisService],
})
export class AnalysisModule {}
