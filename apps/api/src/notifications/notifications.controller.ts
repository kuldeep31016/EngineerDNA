import { Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import type { User } from "@prisma/client";
import type { AppNotification } from "@engineerdna/shared";
import { NotificationsService } from "./notifications.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: User): Promise<AppNotification[]> {
    return this.notifications.list(user.id);
  }

  @Get("unread-count")
  async unreadCount(@CurrentUser() user: User): Promise<{ count: number }> {
    return { count: await this.notifications.unreadCount(user.id) };
  }

  @Patch(":id/read")
  async markRead(@CurrentUser() user: User, @Param("id") id: string): Promise<{ ok: true }> {
    await this.notifications.markRead(user.id, id);
    return { ok: true };
  }

  @Patch("read-all")
  async markAllRead(@CurrentUser() user: User): Promise<{ ok: true }> {
    await this.notifications.markAllRead(user.id);
    return { ok: true };
  }
}
