import { Controller, Get, UseGuards } from "@nestjs/common";
import type { User } from "@prisma/client";
import type { DeveloperDna } from "@engineerdna/shared";
import { DnaService } from "./dna.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

/** Developer DNA endpoint (Module 8). */
@Controller("dna")
@UseGuards(JwtAuthGuard)
export class DnaController {
  constructor(private readonly dnaService: DnaService) {}

  /** GET /api/dna — the developer's DNA scored from evidence. */
  @Get()
  getDna(@CurrentUser() user: User): Promise<DeveloperDna> {
    return this.dnaService.getDna(user);
  }
}
