import { Module } from "@nestjs/common";
import { CareerController } from "./career.controller";
import { CareerService } from "./career.service";
import { DnaModule } from "../dna/dna.module";

/**
 * Career Intelligence (Module 10). Reads the Developer DNA to produce grounded
 * career guidance — never generic.
 */
@Module({
  imports: [DnaModule],
  controllers: [CareerController],
  providers: [CareerService],
  exports: [CareerService],
})
export class CareerModule {}
