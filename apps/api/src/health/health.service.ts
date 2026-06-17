import { Injectable } from "@nestjs/common";
import { APP_NAME, type HealthResponse } from "@engineerdna/shared";

@Injectable()
export class HealthService {
  getHealth(): HealthResponse {
    return {
      status: "ok",
      service: `${APP_NAME}-api`,
      version: process.env.npm_package_version ?? "0.1.0",
      timestamp: new Date().toISOString(),
    };
  }
}
