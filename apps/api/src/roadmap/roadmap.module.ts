import { Module } from "@nestjs/common";
import { RoadmapController } from "./roadmap.controller";
import { RoadmapService } from "./roadmap.service";
import { EvidenceModule } from "../evidence/evidence.module";
import { DnaModule } from "../dna/dna.module";

/**
 * Learning Roadmap (Module 13). Generates a learning path for a role and marks
 * node progress from the developer's evidence (M6) and DNA (M8).
 */
@Module({
  imports: [EvidenceModule, DnaModule],
  controllers: [RoadmapController],
  providers: [RoadmapService],
  exports: [RoadmapService],
})
export class RoadmapModule {}
