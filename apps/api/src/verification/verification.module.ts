import { Module } from "@nestjs/common";
import { VerificationController } from "./verification.controller";
import { VerificationService } from "./verification.service";
import { EvidenceModule } from "../evidence/evidence.module";

/**
 * Skill Verification Engine (Module 7). Reads the Module 6 evidence to verify
 * the passport's self-added skills — closing the "claim vs evidence" loop.
 */
@Module({
  imports: [EvidenceModule],
  controllers: [VerificationController],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {}
