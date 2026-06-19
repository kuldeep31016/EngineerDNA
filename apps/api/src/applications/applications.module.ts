import { Module } from "@nestjs/common";
import { ApplicationsController } from "./applications.controller";
import { ApplicationsService } from "./applications.service";
import { NotificationsModule } from "../notifications/notifications.module";
import { EvidenceModule } from "../evidence/evidence.module";

@Module({
  imports: [NotificationsModule, EvidenceModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
