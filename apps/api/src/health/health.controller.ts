import { Controller, Get } from "@nestjs/common";
import type { HealthResponse } from "@engineerdna/shared";
import { HealthService } from "./health.service";

@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /** GET /api/health — liveness probe used by docker-compose and the web app. */
  @Get()
  getHealth(): HealthResponse {
    return this.healthService.getHealth();
  }

  /** GET /api/health/ready — readiness probe (checks the database). */
  @Get("ready")
  getReadiness() {
    return this.healthService.getReadiness();
  }
}
