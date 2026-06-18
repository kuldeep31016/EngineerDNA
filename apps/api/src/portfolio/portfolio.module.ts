import { Module } from "@nestjs/common";
import { PortfolioController } from "./portfolio.controller";
import { PortfolioService } from "./portfolio.service";

/**
 * Portfolio Generator (Module 18). One lightweight LLM call extracts structured
 * JSON from a resume; everything else (edits, themes, publishing, rendering) is
 * deterministic. AnthropicService comes from the global LlmModule.
 */
@Module({
  controllers: [PortfolioController],
  providers: [PortfolioService],
  exports: [PortfolioService],
})
export class PortfolioModule {}
