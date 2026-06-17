import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";

/**
 * Health module — the canonical example of EngineerDNA's clean-architecture
 * layering: Controller (HTTP) → Service (logic). Every future feature follows
 * this same Controller / Service / Repository shape.
 */
@Module({
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
