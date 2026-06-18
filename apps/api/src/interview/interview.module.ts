import { Module } from "@nestjs/common";
import { InterviewController } from "./interview.controller";
import { InterviewService } from "./interview.service";
import { EvidenceModule } from "../evidence/evidence.module";

/**
 * AI Interview Engine (Module 11). Generates interviews from the developer's
 * verified evidence and grades answers. Reads EvidenceModule; AnthropicService
 * is provided globally by LlmModule.
 */
@Module({
  imports: [EvidenceModule],
  controllers: [InterviewController],
  providers: [InterviewService],
  exports: [InterviewService],
})
export class InterviewModule {}
