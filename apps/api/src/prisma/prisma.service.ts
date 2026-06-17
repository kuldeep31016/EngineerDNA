import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

/**
 * Thin wrapper around PrismaClient so it can be injected anywhere.
 * Connection failures at boot are logged but non-fatal, so the API still
 * starts (and reports health) even if the database is briefly unavailable.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
    } catch (error) {
      this.logger.error("Failed to connect to PostgreSQL on boot", error as Error);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
