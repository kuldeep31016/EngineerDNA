import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { User } from "@prisma/client";
import { UPLOADS_DIR } from "./uploads";
import type {
  ChatMessage,
  Conversation,
  ConversationDetail,
  SendMessageRequest,
} from "@engineerdna/shared";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { MailService } from "../mail/mail.service";

type PartyUser = {
  id: string;
  name: string | null;
  profileImage: string | null;
  profile?: { headline: string | null } | null;
  recruiterProfile?: { companyName: string } | null;
};

@Injectable()
export class MessagingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly mail: MailService,
  ) {}

  /** Recruiter opens (or re-opens) a conversation with an invitation. */
  async invite(recruiter: User, candidateId: string, message: string): Promise<Conversation> {
    if (candidateId === recruiter.id) throw new ForbiddenException("You can't message yourself");
    const student = await this.prisma.user.findUnique({ where: { id: candidateId } });
    if (!student) throw new NotFoundException("Candidate not found");

    const existing = await this.prisma.conversation.findUnique({
      where: { recruiterId_studentId: { recruiterId: recruiter.id, studentId: candidateId } },
    });
    if (existing && existing.status === "ACCEPTED") {
      // Already connected — just send the message into the open chat.
      await this.prisma.message.create({
        data: { conversationId: existing.id, senderId: recruiter.id, body: message },
      });
      await this.touch(existing.id);
    } else {
      // Create or reset to a fresh invitation.
      const convo = existing
        ? await this.prisma.conversation.update({ where: { id: existing.id }, data: { status: "PENDING" } })
        : await this.prisma.conversation.create({ data: { recruiterId: recruiter.id, studentId: candidateId } });
      await this.prisma.message.create({
        data: { conversationId: convo.id, senderId: recruiter.id, body: message },
      });
      await this.touch(convo.id);

      const company = await this.companyName(recruiter.id);
      await this.notifications.create(
        candidateId,
        "New message request",
        `${company ?? recruiter.name ?? "A recruiter"} wants to connect with you.`,
      );
      void this.mail.sendConnectionRequest(
        student.email,
        company ?? recruiter.name ?? "A recruiter",
        message,
      );
    }

    return this.getConversationRow(recruiter, candidateId);
  }

  /** Student accepts or declines a pending invitation. */
  async respond(student: User, conversationId: string, action: "accept" | "decline"): Promise<Conversation> {
    const convo = await this.requireParticipant(student, conversationId);
    if (convo.studentId !== student.id) throw new ForbiddenException("Only the candidate can respond");
    if (convo.status !== "PENDING") throw new ForbiddenException("This invitation was already answered");

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { status: action === "accept" ? "ACCEPTED" : "DECLINED" },
    });

    if (action === "accept") {
      await this.notifications.create(
        convo.recruiterId,
        "Invitation accepted",
        `${student.name ?? "A candidate"} accepted your message request.`,
      );
    }
    return this.byId(student, conversationId);
  }

  /** All conversations for the current user, newest activity first. */
  async list(user: User): Promise<Conversation[]> {
    const convos = await this.prisma.conversation.findMany({
      where: { OR: [{ recruiterId: user.id }, { studentId: user.id }] },
      include: {
        recruiter: { select: recruiterSelect },
        student: { select: studentSelect },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
    });

    const unread = await this.unreadByConversation(user.id);
    return convos.map((c) =>
      toConversation(user.id, c, c.recruiter, c.student, c.messages[0] ?? null, unread.get(c.id) ?? 0),
    );
  }

  /** One conversation with messages; marks the other side's messages as read. */
  async get(user: User, id: string): Promise<ConversationDetail> {
    await this.requireParticipant(user, id);
    await this.prisma.message.updateMany({
      where: { conversationId: id, senderId: { not: user.id }, readAt: null },
      data: { readAt: new Date() },
    });

    const convo = await this.prisma.conversation.findUniqueOrThrow({
      where: { id },
      include: {
        recruiter: { select: recruiterSelect },
        student: { select: studentSelect },
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    const base = toConversation(user.id, convo, convo.recruiter, convo.student, convo.messages.at(-1) ?? null, 0);
    return {
      ...base,
      messages: convo.messages.map((m) => toMessage(user.id, m)),
    };
  }

  /** Send a message — only allowed once the conversation is ACCEPTED. */
  async send(user: User, id: string, input: SendMessageRequest): Promise<ChatMessage> {
    const convo = await this.requireParticipant(user, id);
    if (convo.status !== "ACCEPTED") {
      throw new ForbiddenException("You can chat only after the invitation is accepted.");
    }
    const message = await this.prisma.message.create({
      data: {
        conversationId: id,
        senderId: user.id,
        body: input.body,
        attachmentUrl: input.attachmentUrl ?? null,
        attachmentLabel: input.attachmentLabel ?? null,
      },
    });
    await this.touch(id);

    const recipientId = convo.recruiterId === user.id ? convo.studentId : convo.recruiterId;
    await this.notifications.create(recipientId, "New message", `${user.name ?? "Someone"} sent you a message.`);

    return toMessage(user.id, message);
  }

  /** Send a file attachment — saved to disk, served statically at /uploads. */
  async sendAttachment(user: User, id: string, file?: Express.Multer.File): Promise<ChatMessage> {
    const convo = await this.requireParticipant(user, id);
    if (convo.status !== "ACCEPTED") {
      throw new ForbiddenException("You can share files only after the invitation is accepted.");
    }
    if (!file) throw new BadRequestException("No file uploaded");

    const ext = extname(file.originalname).slice(0, 12);
    const name = `${randomUUID()}${ext}`;
    await writeFile(join(UPLOADS_DIR, name), file.buffer);

    const message = await this.prisma.message.create({
      data: {
        conversationId: id,
        senderId: user.id,
        body: file.originalname,
        attachmentUrl: `/uploads/${name}`,
        attachmentLabel: file.originalname,
      },
    });
    await this.touch(id);

    const recipientId = convo.recruiterId === user.id ? convo.studentId : convo.recruiterId;
    await this.notifications.create(recipientId, "New message", `${user.name ?? "Someone"} sent you a file.`);

    return toMessage(user.id, message);
  }

  /** Total unread messages across the user's conversations (for the nav badge). */
  async unreadCount(user: User): Promise<number> {
    return this.prisma.message.count({
      where: {
        senderId: { not: user.id },
        readAt: null,
        conversation: { OR: [{ recruiterId: user.id }, { studentId: user.id }] },
      },
    });
  }

  /* ---------------- helpers ---------------- */

  private async requireParticipant(user: User, id: string) {
    const convo = await this.prisma.conversation.findUnique({ where: { id } });
    if (!convo || (convo.recruiterId !== user.id && convo.studentId !== user.id)) {
      throw new NotFoundException("Conversation not found");
    }
    return convo;
  }

  private async byId(user: User, id: string): Promise<Conversation> {
    const c = await this.prisma.conversation.findUniqueOrThrow({
      where: { id },
      include: {
        recruiter: { select: recruiterSelect },
        student: { select: studentSelect },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    const unread = await this.unreadByConversation(user.id);
    return toConversation(user.id, c, c.recruiter, c.student, c.messages[0] ?? null, unread.get(c.id) ?? 0);
  }

  private async getConversationRow(user: User, studentId: string): Promise<Conversation> {
    const c = await this.prisma.conversation.findUniqueOrThrow({
      where: { recruiterId_studentId: { recruiterId: user.id, studentId } },
    });
    return this.byId(user, c.id);
  }

  private async touch(id: string) {
    await this.prisma.conversation.update({ where: { id }, data: { updatedAt: new Date() } });
  }

  private async companyName(recruiterId: string): Promise<string | null> {
    const p = await this.prisma.recruiterProfile.findUnique({ where: { userId: recruiterId } });
    return p?.companyName ?? null;
  }

  private async unreadByConversation(userId: string): Promise<Map<string, number>> {
    const rows = await this.prisma.message.groupBy({
      by: ["conversationId"],
      where: {
        senderId: { not: userId },
        readAt: null,
        conversation: { OR: [{ recruiterId: userId }, { studentId: userId }] },
      },
      _count: { _all: true },
    });
    return new Map(rows.map((r) => [r.conversationId, r._count._all]));
  }
}

const recruiterSelect = {
  id: true,
  name: true,
  profileImage: true,
  recruiterProfile: { select: { companyName: true } },
} as const;
const studentSelect = {
  id: true,
  name: true,
  profileImage: true,
  profile: { select: { headline: true } },
} as const;

function toMessage(
  userId: string,
  m: { id: string; senderId: string; body: string; attachmentUrl: string | null; attachmentLabel: string | null; createdAt: Date },
): ChatMessage {
  return {
    id: m.id,
    senderId: m.senderId,
    body: m.body,
    attachmentUrl: m.attachmentUrl,
    attachmentLabel: m.attachmentLabel,
    createdAt: m.createdAt.toISOString(),
    mine: m.senderId === userId,
  };
}

function toConversation(
  userId: string,
  convo: { id: string; status: Conversation["status"]; recruiterId: string; updatedAt: Date },
  recruiter: PartyUser,
  student: PartyUser,
  last: { body: string; createdAt: Date } | null,
  unread: number,
): Conversation {
  const isRecruiter = convo.recruiterId === userId;
  const other = isRecruiter ? student : recruiter;
  return {
    id: convo.id,
    status: convo.status,
    role: isRecruiter ? "recruiter" : "student",
    party: {
      id: other.id,
      name: other.name,
      profileImage: other.profileImage,
      subtitle: isRecruiter ? (other.profile?.headline ?? null) : (other.recruiterProfile?.companyName ?? null),
    },
    lastMessage: last?.body ?? null,
    lastMessageAt: last?.createdAt.toISOString() ?? null,
    unread,
    updatedAt: convo.updatedAt.toISOString(),
  };
}
