import { Module } from "@nestjs/common";
import { PublicController } from "./public.controller";
import { PublicService } from "./public.service";
import { EvidenceModule } from "../evidence/evidence.module";

/** Public verified profiles + embeddable badges (no authentication). */
@Module({
  imports: [EvidenceModule],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
