import { Controller, Get, UseGuards } from "@nestjs/common";
import type { User } from "@prisma/client";
import type { CareerIntelligence } from "@engineerdna/shared";
import { CareerService } from "./career.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

/** Career Intelligence endpoint (Module 10). */
@Controller("career")
@UseGuards(JwtAuthGuard)
export class CareerController {
  constructor(private readonly career: CareerService) {}

  /** GET /api/career — DNA-grounded career guidance. */
  @Get()
  get(@CurrentUser() user: User): Promise<CareerIntelligence> {
    return this.career.getCareer(user);
  }
}
