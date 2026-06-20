import { Module } from "@nestjs/common";
import { MessagingController } from "./messaging.controller";
import { MessagingService } from "./messaging.service";
import { NotificationsModule } from "../notifications/notifications.module";

/**
 * Recruiter↔student messaging. Invitations are gated: a recruiter can open a
 * conversation, but messaging is only unlocked once the student accepts.
 * NotificationsService + MailService (global) drive the alerts.
 */
@Module({
  imports: [NotificationsModule],
  controllers: [MessagingController],
  providers: [MessagingService],
})
export class MessagingModule {}
