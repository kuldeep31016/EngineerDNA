import { Module } from "@nestjs/common";
import { ReputationController } from "./reputation.controller";
import { ReputationService } from "./reputation.service";
import { EvidenceModule } from "../evidence/evidence.module";
import { DnaModule } from "../dna/dna.module";

/**
 * Engineering Reputation Score (Module 19). A fair score from verified signals
 * (M6 evidence + M8 DNA + repos) — never followers or likes. No LLM.
 */
@Module({
  imports: [EvidenceModule, DnaModule],
  controllers: [ReputationController],
  providers: [ReputationService],
  exports: [ReputationService],
})
export class ReputationModule {}
