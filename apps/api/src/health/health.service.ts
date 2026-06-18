import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { APP_NAME, type HealthResponse } from "@engineerdna/shared";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  /** Liveness — the process is up. */
  getHealth(): HealthResponse {
    return {
      status: "ok",
      service: `${APP_NAME}-api`,
      version: process.env.npm_package_version ?? "0.1.0",
      timestamp: new Date().toISOString(),
    };
  }

  /** Readiness — the process can serve traffic (DB reachable). 503 if not. */
  async getReadiness(): Promise<{ status: string; database: string; timestamp: string }> {
    const timestamp = new Date().toISOString();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: "ready", database: "up", timestamp };
    } catch {
      throw new ServiceUnavailableException({ status: "degraded", database: "down", timestamp });
    }
  }
}
