import { Module } from "@nestjs/common";
import { CopilotController } from "./copilot.controller";
import { CopilotService } from "./copilot.service";
import { EvidenceModule } from "../evidence/evidence.module";
import { DnaModule } from "../dna/dna.module";
import { ReputationModule } from "../reputation/reputation.module";

/**
 * AI Career Copilot (Module 20 — capstone). Unifies the verified stores (DNA,
 * reputation, evidence, career) into grounding for a mentor chat. The LLM
 * narrates — it never recomputes. AnthropicService is global via LlmModule.
 */
@Module({
  imports: [EvidenceModule, DnaModule, ReputationModule],
  controllers: [CopilotController],
  providers: [CopilotService],
  exports: [CopilotService],
})
export class CopilotModule {}
