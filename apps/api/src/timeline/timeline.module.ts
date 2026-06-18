import { Module } from "@nestjs/common";
import { TimelineController } from "./timeline.controller";
import { TimelineService } from "./timeline.service";
import { EvidenceModule } from "../evidence/evidence.module";

/**
 * Engineering Timeline (Module 16). A growth journey built live from the M6
 * Evidence Timeline — no LLM, no storage of its own.
 */
@Module({
  imports: [EvidenceModule],
  controllers: [TimelineController],
  providers: [TimelineService],
  exports: [TimelineService],
})
export class TimelineModule {}
