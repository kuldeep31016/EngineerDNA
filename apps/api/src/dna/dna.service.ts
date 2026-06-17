import { Injectable } from "@nestjs/common";
import type { User } from "@prisma/client";
import type { DeveloperDna } from "@engineerdna/shared";
import { EvidenceService } from "../evidence/evidence.service";
import { computeDnaScores } from "./dna-scorer";

@Injectable()
export class DnaService {
  constructor(private readonly evidence: EvidenceService) {}

  /** Compute the developer's DNA live from their current evidence. */
  async getDna(user: User): Promise<DeveloperDna> {
    const evidence = await this.evidence.getDeveloperEvidence(user);
    const { scores, overall, topStrengths } = computeDnaScores(evidence.items);
    return { scores, overall, topStrengths, generatedAt: new Date().toISOString() };
  }
}
