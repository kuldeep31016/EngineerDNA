import { Injectable } from "@nestjs/common";
import type { User } from "@prisma/client";
import type { CareerIntelligence } from "@engineerdna/shared";
import { DnaService } from "../dna/dna.service";
import { computeCareer } from "./career-advisor";

@Injectable()
export class CareerService {
  constructor(private readonly dna: DnaService) {}

  /** Career guidance derived from the developer's DNA. */
  async getCareer(user: User): Promise<CareerIntelligence> {
    const dna = await this.dna.getDna(user);
    const result = computeCareer({
      overall: dna.overall,
      scores: dna.scores,
      topStrengths: dna.topStrengths,
    });
    return { ...result, generatedAt: new Date().toISOString() };
  }
}
