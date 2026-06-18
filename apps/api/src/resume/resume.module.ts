import { Module } from "@nestjs/common";
import { ResumeController } from "./resume.controller";
import { ResumeService } from "./resume.service";
import { EvidenceModule } from "../evidence/evidence.module";
import { DnaModule } from "../dna/dna.module";

/**
 * Resume Intelligence (Module 12). Reviews a resume against the developer's
 * verified evidence (M6) and DNA (M8). AnthropicService comes from LlmModule.
 */
@Module({
  imports: [EvidenceModule, DnaModule],
  controllers: [ResumeController],
  providers: [ResumeService],
  exports: [ResumeService],
})
export class ResumeModule {}
