import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthModule } from "./health/health.module";

/**
 * Root module. Feature modules (auth, profile, github, evidence, ...) will be
 * registered here as they are built — each one independently replaceable.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HealthModule,
  ],
})
export class AppModule {}
