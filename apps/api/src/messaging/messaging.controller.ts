import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import type { User } from "@prisma/client";
import {
  inviteRequestSchema,
  respondInviteRequestSchema,
  sendMessageRequestSchema,
  type ChatMessage,
  type Conversation,
  type ConversationDetail,
  type InviteRequest,
  type RespondInviteRequest,
  type SendMessageRequest,
} from "@engineerdna/shared";
import { MessagingService } from "./messaging.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

@Controller("messages")
@UseGuards(JwtAuthGuard)
export class MessagingController {
  constructor(private readonly messaging: MessagingService) {}

  /** POST /api/messages/invite — recruiter opens a conversation (anti-spam: pending). */
  @Post("invite")
  @UseGuards(RolesGuard)
  @Roles("RECRUITER", "ADMIN")
  invite(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(inviteRequestSchema)) body: InviteRequest,
  ): Promise<Conversation> {
    return this.messaging.invite(user, body.candidateId, body.message);
  }

  /** GET /api/messages — the current user's conversations. */
  @Get()
  list(@CurrentUser() user: User): Promise<Conversation[]> {
    return this.messaging.list(user);
  }

  /** GET /api/messages/unread-count — total unread (for the nav badge). */
  @Get("unread-count")
  async unread(@CurrentUser() user: User): Promise<{ count: number }> {
    return { count: await this.messaging.unreadCount(user) };
  }

  /** GET /api/messages/:id — one conversation with its messages. */
  @Get(":id")
  get(@CurrentUser() user: User, @Param("id") id: string): Promise<ConversationDetail> {
    return this.messaging.get(user, id);
  }

  /** PATCH /api/messages/:id/respond — student accepts/declines the invitation. */
  @Patch(":id/respond")
  respond(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(respondInviteRequestSchema)) body: RespondInviteRequest,
  ): Promise<Conversation> {
    return this.messaging.respond(user, id, body.action);
  }

  /** POST /api/messages/:id/messages — send a message (only once accepted). */
  @Post(":id/messages")
  send(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(sendMessageRequestSchema)) body: SendMessageRequest,
  ): Promise<ChatMessage> {
    return this.messaging.send(user, id, body);
  }
}
