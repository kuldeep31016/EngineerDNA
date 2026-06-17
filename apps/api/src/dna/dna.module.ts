import { Module } from "@nestjs/common";
import { DnaController } from "./dna.controller";
import { DnaService } from "./dna.service";
import { EvidenceModule } from "../evidence/evidence.module";

/**
 * Developer DNA Engine (Module 8). Scores the developer's engineering identity
 * from the Module 6 evidence — every score explainable.
 */
@Module({
  imports: [EvidenceModule],
  controllers: [DnaController],
  providers: [DnaService],
  exports: [DnaService],
})
export class DnaModule {}
